package com.naodab.productservice.services.impl;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.productservice.documents.ListingDocument;
import com.naodab.productservice.dto.request.ListingCreateRequest;
import com.naodab.productservice.dto.request.ListingUpdateRequest;
import com.naodab.productservice.dto.request.ListingSearchRequest;
import com.naodab.productservice.dto.request.ListingVariantCreateRequest;
import com.naodab.productservice.dto.response.ListingItemResponse;
import com.naodab.productservice.dto.response.ListingResponse;
import com.naodab.productservice.dto.response.PagedItemsResponse;
import com.naodab.productservice.mapper.ListingMapper;
import com.naodab.productservice.models.Listing;
import com.naodab.productservice.models.ListingVariant;
import com.naodab.productservice.elasticsearch.ElasticsearchSortBy;
import com.naodab.productservice.models.Product;
import com.naodab.productservice.models.Product.ProductStatus;
import com.naodab.productservice.models.ProductVariant;
import com.naodab.productservice.repositories.ListingRepository;
import com.naodab.productservice.repositories.FacilityRepository;
import com.naodab.productservice.repositories.ListingVariantRepository;
import com.naodab.productservice.repositories.ProductRepository;
import com.naodab.productservice.repositories.ProductVariantRepository;
import com.naodab.productservice.elasticsearch.ElasticsearchNativeQueryHelper;
import com.naodab.productservice.services.ListingSearchService;
import com.naodab.productservice.services.ListingService;

import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class ListingServiceImpl implements ListingService {

  @NonFinal
  @Value("${default.page-size:20}")
  int defaultListingPageSize;

  ListingRepository listingRepository;
  ListingVariantRepository listingVariantRepository;
  ProductRepository productRepository;
  ProductVariantRepository productVariantRepository;
  FacilityRepository facilityRepository;
  ListingSearchService listingSearchService;
  ListingMapper listingMapper;

  @Override
  public List<ListingItemResponse> searchPublicListingItems(ListingSearchRequest request) {
    ListingSearchRequest r = request == null ? ListingSearchRequest.builder().build() : request;
    if (!StringUtils.hasText(r.getKeyword())) {
      r.setKeyword(null);
    } else {
      r.setKeyword(r.getKeyword().trim());
    }
    r.setCategoryIds(normalizeIdListPreserveOrder(r.getCategoryIds()));
    r.setSubCategoryIds(normalizeIdListPreserveOrder(r.getSubCategoryIds()));
    r.setProvinceCode(trimToNull(r.getProvinceCode()));
    r.setWardCode(trimToNull(r.getWardCode()));
    if (r.getListingStatus() == null) {
      r.setListingStatus(Listing.ListingStatus.ACTIVE);
    }
    if (r.getProductStatus() == null) {
      r.setProductStatus(ProductStatus.PUBLISHED);
    }
    ElasticsearchSortBy sort = r.getSortBy() == null ? ElasticsearchSortBy.UPDATED_AT_DESC : r.getSortBy();
    if (sort == ElasticsearchSortBy.RELEVANCE && !StringUtils.hasText(r.getKeyword())) {
      sort = ElasticsearchSortBy.UPDATED_AT_DESC;
    }
    r.setSortBy(sort);

    List<ListingDocument> hits = listingSearchService.searchListings(r);
    return hits.stream()
        .map(doc -> listingMapper.toListingItemResponse(doc))
        .filter(Objects::nonNull)
        .toList();
  }

  private static List<String> normalizeIdListPreserveOrder(List<String> raw) {
    if (raw == null || raw.isEmpty()) {
      return null;
    }
    LinkedHashSet<String> seen = new LinkedHashSet<>();
    List<String> out = new ArrayList<>();
    for (String s : raw) {
      if (!StringUtils.hasText(s)) {
        continue;
      }
      String t = s.trim();
      if (seen.add(t)) {
        out.add(t);
      }
    }
    return out.isEmpty() ? null : out;
  }

  @Override
  public PagedItemsResponse<ListingItemResponse> listListingItemsForFacility(
      String profileId,
      String facilityId,
      Integer page,
      Integer pageSize,
      String keyword,
      String productId) {
    String fid = facilityId == null || facilityId.isBlank() ? "" : facilityId.trim();
    facilityRepository
        .findByOwnerIdAndIdAndDeletedAtIsNull(profileId, fid)
        .orElseThrow(() -> new AppException(ErrorCode.FACILITY_NOT_FOUND));
    int normalizedPage = ElasticsearchNativeQueryHelper.normalizePage(page);
    int normalizedSize = ElasticsearchNativeQueryHelper.normalizePageSize(pageSize, defaultListingPageSize);
    Pageable pageable = PageRequest.of(normalizedPage, normalizedSize);
    String kw = trimToNull(keyword);
    String pid = trimToNull(productId);
    Page<Listing> result = kw == null && pid == null
        ? listingRepository.findSellerItemsByFacilityIdPage(fid, pageable)
        : listingRepository.findSellerItemsByFacilityIdPageFiltered(fid, kw, pid, pageable);
    List<ListingItemResponse> items = result.getContent().stream()
        .map(listingMapper::toListingItemResponse)
        .toList();
    return PagedItemsResponse.<ListingItemResponse>builder()
        .items(items)
        .totalCount(result.getTotalElements())
        .page(normalizedPage)
        .pageSize(normalizedSize)
        .build();
  }

  @Override
  @Transactional
  public ListingResponse createListing(String profileId, ListingCreateRequest request) {
    Product product = productRepository.findByIdAndDeletedAtIsNull(request.getProductId().trim())
        .orElseThrow(() -> new AppException(ErrorCode.INVALID_INPUT));

    if (product.getFacility() == null || !profileId.equals(product.getFacility().getOwnerId())) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }

    if (product.getStatus() != Product.ProductStatus.PUBLISHED) {
      throw new AppException(ErrorCode.PRODUCT_NOT_PUBLISHED);
    }

    Listing.ListingType listingType = request.getListingType() != null ? request.getListingType()
        : Listing.ListingType.BUY;
    ListingPriceAggregate priceAggregate = ListingPriceAggregate.fromVariantRequests(request.getVariants(),
        listingType);

    Listing listing = Listing.builder()
        .product(product)
        .title(request.getTitle().trim())
        .description(trimToNull(request.getDescription()))
        .listingType(listingType)
        .minPrice(priceAggregate.minPrice())
        .maxPrice(priceAggregate.maxPrice())
        .build();

    Listing saved = listingRepository.save(listing);

    if (request.getVariants() != null && !request.getVariants().isEmpty()) {
      for (ListingVariantCreateRequest variantReq : request.getVariants()) {
        ProductVariant pv = productVariantRepository
            .findByIdAndProduct_IdAndDeletedAtIsNull(
                variantReq.getProductVariantId().trim(), product.getId())
            .orElseThrow(() -> new AppException(ErrorCode.INVALID_INPUT));
        listingVariantRepository.save(ListingVariant.builder()
            .listing(saved)
            .productVariant(pv)
            .buyPrice(variantReq.getBuyPrice())
            .rentPrice(variantReq.getRentPrice())
            .rentUnit(variantReq.getRentUnit() != null ? variantReq.getRentUnit()
                : ListingVariant.RentUnit.DAY)
            .isActive(variantReq.getIsActive() != null ? variantReq.getIsActive() : Boolean.TRUE)
            .build());
      }
    }

    listingRepository.flush();
    Listing indexed = listingRepository.findWithProductGraphById(saved.getId()).orElse(saved);
    listingSearchService.sync(indexed);

    List<ListingVariant> variantEntities = listingVariantRepository.findByListing_Id(saved.getId());
    return listingMapper.toListingResponse(indexed, variantEntities);
  }

  @Override
  @Transactional
  public ListingResponse updateListing(String profileId, String listingId, ListingUpdateRequest request) {
    if (request == null || !StringUtils.hasText(listingId)) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }

    boolean any = false;
    if (request.getTitle() != null) {
      any = true;
    }
    if (request.getDescription() != null) {
      any = true;
    }
    if (request.getListingStatus() != null) {
      any = true;
    }
    if (!any) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }

    Listing listing = listingRepository.findWithProductGraphById(listingId.trim())
        .orElseThrow(() -> new AppException(ErrorCode.INVALID_INPUT));

    Product product = listing.getProduct();
    if (product == null || product.getFacility() == null || !profileId.equals(product.getFacility().getOwnerId())) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }
    if (product.getDeletedAt() != null) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }

    if (request.getTitle() != null) {
      String t = request.getTitle().trim();
      if (!StringUtils.hasText(t)) {
        throw new AppException(ErrorCode.INVALID_INPUT);
      }
      listing.setTitle(t);
    }
    if (request.getDescription() != null) {
      listing.setDescription(trimToNull(request.getDescription()));
    }
    if (request.getListingStatus() != null) {
      listing.setListingStatus(request.getListingStatus());
    }

    Listing saved = listingRepository.save(listing);
    listingRepository.flush();
    Listing indexed = listingRepository.findWithProductGraphById(saved.getId()).orElse(saved);
    listingSearchService.sync(indexed);

    List<ListingVariant> variantEntities = listingVariantRepository.findByListing_Id(saved.getId());
    return listingMapper.toListingResponse(indexed, variantEntities);
  }

  private record ListingPriceAggregate(Double minPrice, Double maxPrice) {

    static ListingPriceAggregate fromVariantRequests(
        List<ListingVariantCreateRequest> variants,
        Listing.ListingType listingType) {
      if (variants == null || variants.isEmpty()) {
        return new ListingPriceAggregate(null, null);
      }

      List<Double> prices = variants.stream().map(variant -> variantPrice(listingType, variant))
          .filter(Objects::nonNull).toList();
      if (prices.isEmpty()) {
        return new ListingPriceAggregate(null, null);
      }

      return new ListingPriceAggregate(
          Collections.min(prices),
          Collections.max(prices));
    }

    private static Double variantPrice(Listing.ListingType listingType, ListingVariantCreateRequest variant) {
      if (listingType == Listing.ListingType.RENT) {
        return variant.getRentPrice();
      }

      return variant.getBuyPrice();
    }
  }

  private static String trimToNull(String value) {
    if (!StringUtils.hasText(value)) {
      return null;
    }
    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }
}
