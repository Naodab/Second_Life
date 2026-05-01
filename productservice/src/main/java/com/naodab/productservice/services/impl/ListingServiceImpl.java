package com.naodab.productservice.services.impl;

import java.util.Collections;
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
import com.naodab.productservice.dto.request.ListingCreateRequest;
import com.naodab.productservice.dto.request.ListingVariantCreateRequest;
import com.naodab.productservice.dto.response.ListingItemResponse;
import com.naodab.productservice.dto.response.ListingResponse;
import com.naodab.productservice.dto.response.ListingVariantResponse;
import com.naodab.productservice.dto.response.PagedItemsResponse;
import com.naodab.productservice.mapper.ListingItemMapper;
import com.naodab.productservice.models.Listing;
import com.naodab.productservice.models.ListingVariant;
import com.naodab.productservice.models.Product;
import com.naodab.productservice.models.ProductVariant;
import com.naodab.productservice.repositories.ListingRepository;
import com.naodab.productservice.repositories.FacilityRepository;
import com.naodab.productservice.repositories.ListingVariantRepository;
import com.naodab.productservice.repositories.ProductRepository;
import com.naodab.productservice.repositories.ProductVariantRepository;
import com.naodab.productservice.elasticsearch.ElasticsearchNativeQueryHelper;
import com.naodab.productservice.services.ListingSearchService;
import com.naodab.productservice.services.ListingService;

import jakarta.transaction.Transactional;
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
  ListingItemMapper listingItemMapper;

  @Override
  public PagedItemsResponse<ListingItemResponse> listListingItemsForFacility(
      String profileId,
      String facilityId,
      Integer page,
      Integer pageSize) {
    String fid =
        facilityId == null || facilityId.isBlank() ? "" : facilityId.trim();
    facilityRepository
        .findByOwnerIdAndIdAndDeletedAtIsNull(profileId, fid)
        .orElseThrow(() -> new AppException(ErrorCode.FACILITY_NOT_FOUND));
    int normalizedPage = ElasticsearchNativeQueryHelper.normalizePage(page);
    int normalizedSize =
        ElasticsearchNativeQueryHelper.normalizePageSize(pageSize, defaultListingPageSize);
    Pageable pageable = PageRequest.of(normalizedPage, normalizedSize);
    Page<Listing> result = listingRepository.findSellerItemsByFacilityIdPage(fid, pageable);
    List<ListingItemResponse> items = result.getContent().stream()
        .map(listingItemMapper::toListingItemResponse)
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
    return toListingResponse(indexed, variantEntities);
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

  private static ListingResponse toListingResponse(Listing listing, List<ListingVariant> variants) {
    Product product = listing.getProduct();
    List<ListingVariantResponse> variantResponses = variants.stream()
        .map(v -> ListingVariantResponse.builder()
            .id(v.getId())
            .productVariantId(v.getProductVariant() == null ? null : v.getProductVariant().getId())
            .buyPrice(v.getBuyPrice())
            .rentPrice(v.getRentPrice())
            .rentUnit(v.getRentUnit())
            .isActive(v.getIsActive())
            .build())
        .toList();

    return ListingResponse.builder()
        .id(listing.getId())
        .productId(product == null ? null : product.getId())
        .title(listing.getTitle())
        .description(listing.getDescription())
        .listingType(listing.getListingType())
        .listingStatus(listing.getListingStatus())
        .minPrice(listing.getMinPrice())
        .maxPrice(listing.getMaxPrice())
        .variants(variantResponses.isEmpty() ? Collections.emptyList() : variantResponses)
        .build();
  }
}
