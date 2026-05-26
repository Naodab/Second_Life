package com.naodab.productservice.services.impl;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.productservice.dto.request.ListingCreateRequest;
import com.naodab.productservice.dto.request.ListingUpdateRequest;
import com.naodab.productservice.dto.request.ListingSearchRequest;
import com.naodab.productservice.dto.request.ListingVariantCreateRequest;
import com.naodab.productservice.dto.response.ListingItemResponse;
import com.naodab.productservice.dto.response.ListingVariantContextResponse;
import com.naodab.productservice.dto.response.ListingPublicDetailResponse;
import com.naodab.productservice.dto.response.ListingSuggestionResponse;
import com.naodab.productservice.dto.response.ListingResponse;
import com.naodab.productservice.dto.response.PagedItemsResponse;
import com.naodab.productservice.dto.response.ProductResponse;
import com.naodab.productservice.mapper.FacilityMapper;
import com.naodab.productservice.mapper.ProductMapper;
import com.naodab.productservice.mapper.ListingMapper;
import com.naodab.productservice.models.Facility;
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
import com.naodab.productservice.kafka.CreateInventoryItemsEventProducer;
import com.naodab.productservice.services.ListingSearchService;
import com.naodab.productservice.services.ListingService;

import org.hibernate.Hibernate;

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
  ProductMapper productMapper;
  FacilityMapper facilityMapper;
  CreateInventoryItemsEventProducer createInventoryItemsEventProducer;

  @Override
  @Transactional(readOnly = true)
  public ListingPublicDetailResponse getPublicListingById(String listingId) {
    if (!StringUtils.hasText(listingId)) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    Listing listing = listingRepository.findWithProductGraphById(listingId.trim())
        .orElseThrow(() -> new AppException(ErrorCode.INVALID_INPUT));
    Product product = listing.getProduct();
    if (product == null || product.getDeletedAt() != null) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    if (product.getStatus() != Product.ProductStatus.PUBLISHED) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    if (listing.getListingStatus() != Listing.ListingStatus.ACTIVE) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    ProductDocumentGraphInitializer.initialize(product);
    if (listing.getFacility() != null) {
      Hibernate.initialize(listing.getFacility());
    }
    List<ListingVariant> listingVariants = listingVariantRepository.findByListing_Id(listing.getId());
    ProductResponse productResp = productMapper.toProductResponse(
        product, productMapper.collectDistinctAttributesFromProduct(product));
    Facility listingFacility = listing.getFacility();
    return ListingPublicDetailResponse.builder()
        .listing(listingMapper.toListingResponse(listing, listingVariants))
        .product(productResp)
        .facility(listingFacility == null ? null : facilityMapper.toFacilityResponse(listingFacility))
        .build();
  }

  @Override
  @Transactional(readOnly = true)
  public void assertListingVariantOnListing(String listingId, String listingVariantId) {
    if (!StringUtils.hasText(listingId) || !StringUtils.hasText(listingVariantId)) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    if (!listingVariantRepository.existsByIdAndListing_Id(
        listingVariantId.trim(), listingId.trim())) {
      throw new AppException(ErrorCode.LISTING_VARIANT_NOT_FOUND);
    }
  }

  @Override
  @Transactional(readOnly = true)
  public ListingVariantContextResponse getListingVariantContext(String listingVariantId) {
    if (!StringUtils.hasText(listingVariantId)) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    ListingVariant variant = listingVariantRepository.findById(listingVariantId.trim())
        .orElseThrow(() -> new AppException(ErrorCode.LISTING_VARIANT_NOT_FOUND));
    Listing listing = variant.getListing();
    if (listing == null) {
      throw new AppException(ErrorCode.LISTING_VARIANT_NOT_FOUND);
    }
    Hibernate.initialize(listing);
    Product product = listing.getProduct();
    if (product != null) {
      ProductDocumentGraphInitializer.initialize(product);
    }
    ProductVariant productVariant = variant.getProductVariant();
    if (productVariant != null) {
      Hibernate.initialize(productVariant);
    }
    Facility listingFacility = listing.getFacility();
    if (listingFacility != null) {
      Hibernate.initialize(listingFacility);
    }

    String productName = product != null ? product.getName() : null;
    String listingTitle = listing.getTitle();
    String title = StringUtils.hasText(listingTitle) ? listingTitle.trim()
        : (StringUtils.hasText(productName) ? productName.trim() : "Sản phẩm");
    String variantLabel = productVariant != null && StringUtils.hasText(productVariant.getSku())
        ? productVariant.getSku().trim()
        : null;
    String thumbnailUrl = product != null ? productMapper.thumbnailImageUrl(product) : null;
    String facilityId = listingFacility != null ? listingFacility.getId() : null;

    return ListingVariantContextResponse.builder()
        .listingId(listing.getId())
        .listingVariantId(variant.getId())
        .facilityId(facilityId)
        .title(title)
        .productName(productName)
        .variantLabel(variantLabel)
        .thumbnailUrl(StringUtils.hasText(thumbnailUrl) ? thumbnailUrl.trim() : null)
        .listingType(listing.getListingType())
        .buyPrice(variant.getBuyPrice())
        .rentPrice(variant.getRentPrice())
        .build();
  }

  @Override
  public PagedItemsResponse<ListingItemResponse> searchPublicListingItems(ListingSearchRequest request) {
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

    int normalizedPage = ElasticsearchNativeQueryHelper.normalizePage(r.getPage());
    int normalizedSize = ElasticsearchNativeQueryHelper.normalizePageSize(r.getPageSize(), defaultListingPageSize);
    r.setPage(normalizedPage);
    r.setPageSize(normalizedSize);

    ListingSearchService.ListingDocumentPage esPage = listingSearchService.searchListingsPaged(r);
    List<ListingItemResponse> items = esPage.items().stream()
        .map(listingMapper::toListingItemResponse)
        .filter(Objects::nonNull)
        .toList();
    return PagedItemsResponse.<ListingItemResponse>builder()
        .items(items)
        .totalCount(esPage.totalCount())
        .page(normalizedPage)
        .pageSize(normalizedSize)
        .build();
  }

  @Override
  public List<ListingSuggestionResponse> suggestSearch(String keyword, Integer limit) {
    if (!StringUtils.hasText(keyword)) {
      return Collections.emptyList();
    }
    int cap = limit == null || limit < 1 ? 8 : Math.min(limit, 20);
    ListingSearchRequest r = ListingSearchRequest.builder()
        .keyword(keyword.trim())
        .page(0)
        .pageSize(Math.min(cap * 4, 40))
        .sortBy(ElasticsearchSortBy.RELEVANCE)
        .build();
    List<ListingItemResponse> items = searchPublicListingItems(r).getItems();
    List<ListingSuggestionResponse> out = new ArrayList<>(cap);
    LinkedHashSet<String> seenTitles = new LinkedHashSet<>();
    for (ListingItemResponse it : items) {
      if (it != null && StringUtils.hasText(it.getTitle())) {
        String key = it.getTitle().trim().toLowerCase(Locale.ROOT);
        if (seenTitles.add(key)) {
          out.add(ListingSuggestionResponse.builder()
              .id(it.getId())
              .title(it.getTitle().trim())
              .productId(it.getProductId())
              .build());
          if (out.size() >= cap) {
            break;
          }
        }
      }
    }
    return out;
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
    String kw = trimToNull(keyword);
    String pid = trimToNull(productId);

    ListingSearchRequest searchRequest = ListingSearchRequest.builder()
        .facilityId(fid)
        .keyword(kw)
        .productId(pid)
        .page(normalizedPage)
        .pageSize(normalizedSize)
        .sortBy(kw != null ? ElasticsearchSortBy.RELEVANCE : ElasticsearchSortBy.CREATED_AT_DESC)
        .build();

    ListingSearchService.ListingDocumentPage esPage = listingSearchService.searchListingsPaged(searchRequest);
    List<ListingItemResponse> items = esPage.items().stream()
        .map(listingMapper::toListingItemResponse)
        .filter(Objects::nonNull)
        .toList();
    return PagedItemsResponse.<ListingItemResponse>builder()
        .items(items)
        .totalCount(esPage.totalCount())
        .page(normalizedPage)
        .pageSize(normalizedSize)
        .build();
  }

  @Override
  @Transactional
  public ListingResponse createListing(String profileId, ListingCreateRequest request) {
    Product product = productRepository.findByIdAndDeletedAtIsNull(request.getProductId().trim())
        .orElseThrow(() -> new AppException(ErrorCode.INVALID_INPUT));
    Facility facility = facilityRepository
        .findByOwnerIdAndIdAndDeletedAtIsNull(profileId, request.getFacilityId().trim())
        .orElseThrow(() -> new AppException(ErrorCode.FACILITY_NOT_FOUND));

    if (!profileId.equals(product.getOwnerId())) {
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
        .facility(facility)
        .title(request.getTitle().trim())
        .description(trimToNull(request.getDescription()))
        .listingType(listingType)
        .minPrice(priceAggregate.minPrice())
        .maxPrice(priceAggregate.maxPrice())
        .build();

    Listing saved = listingRepository.save(listing);

    List<ListingVariant> persistedVariants = new ArrayList<>();
    if (request.getVariants() != null && !request.getVariants().isEmpty()) {
      for (ListingVariantCreateRequest variantReq : request.getVariants()) {
        ProductVariant pv = productVariantRepository
            .findByIdAndProduct_IdAndDeletedAtIsNull(
                variantReq.getProductVariantId().trim(), product.getId())
            .orElseThrow(() -> new AppException(ErrorCode.INVALID_INPUT));
        ListingVariant persisted = listingVariantRepository.save(ListingVariant.builder()
            .listing(saved)
            .productVariant(pv)
            .quantity(variantReq.getQuantity())
            .buyPrice(variantReq.getBuyPrice())
            .rentPrice(variantReq.getRentPrice())
            .rentUnit(variantReq.getRentUnit() != null ? variantReq.getRentUnit()
                : ListingVariant.RentUnit.DAY)
            .isActive(variantReq.getIsActive() != null ? variantReq.getIsActive() : Boolean.TRUE)
            .build());
        persistedVariants.add(persisted);
      }
    }

    listingRepository.flush();
    Listing indexed = listingRepository.findWithProductGraphById(saved.getId()).orElse(saved);
    listingSearchService.sync(indexed);

    createInventoryItemsEventProducer.publishForNewListing(saved.getId(), listingType, persistedVariants);

    List<ListingVariant> variantEntities = listingVariantRepository.findByListing_Id(saved.getId());
    return listingMapper.toListingResponse(indexed, variantEntities);
  }

  @Override
  @Transactional
  public ListingResponse updateListing(String profileId, String listingId, ListingUpdateRequest request) {
    if (request == null || !StringUtils.hasText(listingId)) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }

    if (request.getTitle() == null && request.getDescription() == null && request.getListingStatus() == null
        && request.getFacilityId() == null) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }

    Listing listing = listingRepository.findWithProductGraphById(listingId.trim())
        .orElseThrow(() -> new AppException(ErrorCode.INVALID_INPUT));

    Product product = listing.getProduct();
    if (product == null || !profileId.equals(product.getOwnerId())) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }
    if (StringUtils.hasText(request.getFacilityId())) {
      Facility facility = facilityRepository
          .findByOwnerIdAndIdAndDeletedAtIsNull(profileId, request.getFacilityId().trim())
          .orElseThrow(() -> new AppException(ErrorCode.FACILITY_NOT_FOUND));
      listing.setFacility(facility);
    }

    String t = request.getTitle().trim();
    if (product.getDeletedAt() != null || !StringUtils.hasText(t)) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }

    listing.setTitle(t);
    if (request.getDescription() != null) {
      String d = request.getDescription().trim();
      listing.setDescription(StringUtils.hasText(d) ? d : null);
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
