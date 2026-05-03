package com.naodab.productservice.services.impl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.util.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.productservice.dto.request.ProductCreateRequest;
import com.naodab.productservice.dto.request.ProductUpdateRequest;
import com.naodab.productservice.dto.request.ProductVariantCreateRequest;
import com.naodab.productservice.dto.response.ProductResponse;
import com.naodab.productservice.dto.response.ProductVariantSummaryResponse;
import com.naodab.productservice.mapper.ProductMapper;
import com.naodab.productservice.mapper.ProductVariantMapper;
import com.naodab.productservice.models.Attribute;
import com.naodab.productservice.models.AttributeValue;
import com.naodab.productservice.models.Facility;
import com.naodab.productservice.models.Product;
import com.naodab.productservice.models.ProductMedia;
import com.naodab.productservice.models.ProductSubCategory;
import com.naodab.productservice.models.ProductSubCategoryId;
import com.naodab.productservice.models.ProductVariantAttributeValue;
import com.naodab.productservice.models.ProductVariant;
import com.naodab.productservice.models.SubCategory;
import com.naodab.productservice.repositories.AttributeRepository;
import com.naodab.productservice.repositories.AttributeValueRepository;
import com.naodab.productservice.repositories.FacilityRepository;
import com.naodab.productservice.repositories.ProductRepository;
import com.naodab.productservice.repositories.ListingVariantRepository;
import com.naodab.productservice.repositories.SubCategoryRepository;
import com.naodab.productservice.services.ListingSearchService;
import com.naodab.productservice.services.ProductSearchService;
import com.naodab.productservice.services.ProductService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class ProductServiceImpl implements ProductService {
  ProductRepository productRepository;
  FacilityRepository facilityRepository;
  SubCategoryRepository subCategoryRepository;
  AttributeRepository attributeRepository;
  AttributeValueRepository attributeValueRepository;
  ListingVariantRepository listingVariantRepository;
  ProductSearchService productSearchService;
  ListingSearchService listingSearchService;
  ProductMapper productMapper;
  ProductVariantMapper productVariantMapper;

  @Override
  @Transactional
  public ProductResponse createProduct(String profileId, ProductCreateRequest request) {
    Facility facility = getFacilityByOwnerAndId(profileId, request.getFacilityId());
    ProductRequestData requestData = getAndValidateProductRequestData(
        request.getSubCategoryIds(),
        request.getPrimarySubCategoryId(),
        request.getAttributeIds(),
        request.getVariants());

    Product product = Product.builder()
        .name(request.getName())
        .description(request.getDescription())
        .facility(facility)
        .primarySubCategory(requestData.primarySubCategory())
        .status(Product.ProductStatus.DRAFT)
        .build();

    product.setProductSubCategories(
        requestData.subCategories().stream()
            .map(subCategory -> ProductSubCategory.builder()
                .id(new ProductSubCategoryId(null, subCategory.getId()))
                .product(product)
                .subCategory(subCategory)
                .build())
            .collect(Collectors.toList()));

    final int[] sequence = { 1 };
    product.setVariants(request.getVariants().stream()
        .map(variantRequest -> toProductVariant(product, variantRequest, requestData.attributeValueById(),
            sequence[0]++))
        .toList());

    Product savedProduct = productRepository.save(product);
    for (ProductSubCategory productSubCategory : savedProduct.getProductSubCategories()) {
      productSubCategory
          .setId(new ProductSubCategoryId(savedProduct.getId(), productSubCategory.getSubCategory().getId()));
    }

    productSearchService.sync(savedProduct.getId());
    listingSearchService.reindexAllListingsForProduct(savedProduct.getId());
    return productMapper.toProductResponse(savedProduct, requestData.attributes());
  }

  @Override
  @Transactional
  public ProductResponse updateProduct(String profileId, String id, ProductUpdateRequest request) {
    if (id == null || id.isBlank()) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }

    Product product = productRepository.findByIdAndDeletedAtIsNull(id)
        .orElseThrow(() -> new AppException(ErrorCode.INVALID_INPUT));
    if (product.getFacility() == null || !profileId.equals(product.getFacility().getOwnerId())) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }

    Facility facility = getFacilityByOwnerAndId(profileId, request.getFacilityId());
    ProductRequestData requestData = getAndValidateProductRequestData(
        request.getSubCategoryIds(),
        request.getPrimarySubCategoryId(),
        request.getAttributeIds(),
        request.getVariants());

    product.setName(request.getName());
    product.setDescription(request.getDescription());
    product.setFacility(facility);
    product.setPrimarySubCategory(requestData.primarySubCategory());

    product.getProductSubCategories().clear();
    product.getProductSubCategories().addAll(
        requestData.subCategories().stream()
            .map(subCategory -> ProductSubCategory.builder()
                .id(new ProductSubCategoryId(product.getId(), subCategory.getId()))
                .product(product)
                .subCategory(subCategory)
                .build())
            .toList());

    mergeVariantsKeepingIds(product, request.getVariants(), requestData.attributeValueById());

    Product savedProduct = productRepository.save(product);
    productSearchService.sync(savedProduct.getId());
    listingSearchService.reindexAllListingsForProduct(savedProduct.getId());
    return productMapper.toProductResponse(savedProduct, requestData.attributes());
  }

  @Override
  @Transactional
  public ProductResponse publishDraftProduct(String profileId, String productId) {
    if (!StringUtils.hasText(productId) || !StringUtils.hasText(profileId)) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    Product product = productRepository.findByIdAndDeletedAtIsNull(productId.trim())
        .orElseThrow(() -> new AppException(ErrorCode.INVALID_INPUT));
    if (product.getFacility() == null || !profileId.trim().equals(product.getFacility().getOwnerId())) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }
    if (product.getStatus() != Product.ProductStatus.DRAFT) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    if (!StringUtils.hasText(productMapper.thumbnailImageUrl(product))) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    product.setStatus(Product.ProductStatus.PUBLISHED);
    Product saved = productRepository.save(product);
    productSearchService.sync(saved.getId());
    listingSearchService.reindexAllListingsForProduct(saved.getId());
    List<Attribute> attrs = extractAttributesFromProductVariants(product);
    return productMapper.toProductResponse(saved, attrs);
  }

  private static List<String> sortedDistinctIds(List<String> raw) {
    if (raw == null || raw.isEmpty()) {
      return List.of();
    }
    List<String> out = raw.stream()
        .filter(StringUtils::hasText)
        .map(String::trim)
        .distinct()
        .sorted()
        .toList();
    return out.isEmpty() ? List.of() : out;
  }

  private static List<String> attributeValueIdsSorted(ProductVariant v) {
    if (v == null || v.getVariantAttributeValues() == null) {
      return List.of();
    }
    List<String> raw = new ArrayList<>();
    for (ProductVariantAttributeValue link : v.getVariantAttributeValues()) {
      AttributeValue av = link.getAttributeValue();
      if (av != null && StringUtils.hasText(av.getId())) {
        raw.add(av.getId().trim());
      }
    }
    return sortedDistinctIds(raw);
  }

  private void validateSameComboOrThrow(ProductVariant existing, ProductVariantCreateRequest vr) {
    List<String> a = attributeValueIdsSorted(existing);
    List<String> b = sortedDistinctIds(vr.getAttributeValueIds());
    if (!a.equals(b)) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
  }

  private void mergeVariantsKeepingIds(
      Product product,
      List<ProductVariantCreateRequest> incoming,
      Map<String, AttributeValue> attributeValueById) {
    if (product.getVariants() == null) {
      product.setVariants(new ArrayList<>());
    }
    List<ProductVariantCreateRequest> safe = incoming == null ? List.of() : incoming;

    Set<String> keepIdsReq = safe.stream()
        .map(ProductVariantCreateRequest::getId)
        .filter(StringUtils::hasText)
        .map(String::trim)
        .collect(Collectors.toSet());

    Iterator<ProductVariant> it = product.getVariants().iterator();
    while (it.hasNext()) {
      ProductVariant row = it.next();
      if (!keepIdsReq.contains(row.getId())) {
        if (listingVariantRepository.existsByProductVariantId(row.getId())) {
          throw new AppException(ErrorCode.PRODUCT_VARIANT_IN_USE);
        }
        it.remove();
      }
    }

    Set<String> seenReqIds = new HashSet<>();

    for (ProductVariantCreateRequest vr : safe) {
      if (StringUtils.hasText(vr.getId())) {
        String tid = vr.getId().trim();
        if (!seenReqIds.add(tid)) {
          throw new AppException(ErrorCode.INVALID_INPUT);
        }
        ProductVariant existing = product.getVariants().stream()
            .filter(v -> tid.equals(v.getId()))
            .findFirst()
            .orElseThrow(() -> new AppException(ErrorCode.INVALID_INPUT));
        validateSameComboOrThrow(existing, vr);
        existing.setQuantity(vr.getQuantity());
      } else {
        int seq = product.getVariants().size() + 1;
        product.getVariants().add(toProductVariant(product, vr, attributeValueById, seq));
      }
    }
  }

  private List<Attribute> extractAttributesFromProductVariants(Product product) {
    return productMapper.collectDistinctAttributesFromProduct(product);
  }

  private Facility getFacilityByOwnerAndId(String profileId, String facilityId) {
    return facilityRepository.findByOwnerIdAndIdAndDeletedAtIsNull(profileId, facilityId)
        .orElseThrow(() -> new AppException(ErrorCode.FACILITY_NOT_FOUND));
  }

  private List<SubCategory> getSubCategories(List<String> subCategoryIds) {
    List<SubCategory> subCategories = subCategoryRepository.findAllById(subCategoryIds);
    if (subCategories.size() != subCategoryIds.size()) {
      throw new AppException(ErrorCode.SUB_CATEGORY_NOT_FOUND);
    }

    return subCategories;
  }

  private SubCategory getPrimarySubCategory(String primarySubCategoryId, List<SubCategory> subCategories) {
    return subCategories.stream()
        .filter(subCategory -> subCategory.getId().equals(primarySubCategoryId))
        .findFirst()
        .orElseThrow(() -> new AppException(ErrorCode.SUB_CATEGORY_NOT_FOUND));
  }

  private List<Attribute> getAttributes(List<String> attributeIds) {
    List<Attribute> attributes = attributeRepository.findAllById(attributeIds);
    if (attributes.size() != attributeIds.size()) {
      throw new AppException(ErrorCode.ATTRIBUTE_NOT_FOUND);
    }

    return attributes;
  }

  private ProductRequestData getAndValidateProductRequestData(
      List<String> subCategoryIds,
      String primarySubCategoryId,
      List<String> attributeIds,
      List<ProductVariantCreateRequest> variants) {
    List<SubCategory> subCategories = getSubCategories(subCategoryIds);
    SubCategory primarySubCategory = getPrimarySubCategory(primarySubCategoryId, subCategories);
    List<Attribute> attributes = getAttributes(attributeIds);
    Map<String, AttributeValue> attributeValueById = getAndValidateAttributeValues(attributeIds, variants);
    return new ProductRequestData(subCategories, primarySubCategory, attributes, attributeValueById);
  }

  private Map<String, AttributeValue> getAndValidateAttributeValues(
      List<String> attributeIds,
      List<ProductVariantCreateRequest> variants) {
    Set<String> requestedAttributeIds = new HashSet<>(attributeIds);
    List<String> requestedAttributeValueIds = variants.stream()
        .flatMap(variant -> variant.getAttributeValueIds().stream())
        .distinct()
        .toList();

    if (requestedAttributeValueIds.isEmpty()) {
      return Collections.emptyMap();
    }

    List<AttributeValue> attributeValues = attributeValueRepository.findAllById(requestedAttributeValueIds);
    if (attributeValues.size() != requestedAttributeValueIds.size()) {
      throw new AppException(ErrorCode.ATTRIBUTE_VALUE_NOT_FOUND);
    }

    boolean hasInvalidAttributeValue = attributeValues.stream()
        .map(AttributeValue::getAttribute)
        .anyMatch(attribute -> attribute == null || !requestedAttributeIds.contains(attribute.getId()));
    if (hasInvalidAttributeValue) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }

    return attributeValues.stream()
        .collect(Collectors.toMap(AttributeValue::getId, Function.identity()));
  }

  private record ProductRequestData(
      List<SubCategory> subCategories,
      SubCategory primarySubCategory,
      List<Attribute> attributes,
      Map<String, AttributeValue> attributeValueById) {
  }

  private ProductVariant toProductVariant(
      Product product,
      ProductVariantCreateRequest variantRequest,
      Map<String, AttributeValue> attributeValueById,
      int sequence) {
    List<AttributeValue> attributeValues = variantRequest.getAttributeValueIds().stream()
        .map(attributeValueId -> {
          AttributeValue attributeValue = attributeValueById.get(attributeValueId);
          if (attributeValue == null) {
            throw new AppException(ErrorCode.ATTRIBUTE_VALUE_NOT_FOUND);
          }
          return attributeValue;
        })
        .toList();

    ProductVariant variant = ProductVariant.builder()
        .product(product)
        .sku(generateSku(product, attributeValues, sequence))
        .quantity(variantRequest.getQuantity())
        .build();

    variant.setVariantAttributeValues(productVariantMapper.toVariantAttributeValues(variant, attributeValues));
    return variant;
  }

  private String generateSku(Product product, List<AttributeValue> attributeValues, int sequence) {
    SubCategory primarySubCategory = product.getPrimarySubCategory();
    String categoryCode = safeSkuPart(
        primarySubCategory.getCategory() == null ? null : primarySubCategory.getCategory().getCode(),
        primarySubCategory.getCategory() == null ? "CAT" : primarySubCategory.getCategory().getId());
    String subCategoryCode = safeSkuPart(primarySubCategory.getCode(), primarySubCategory.getId());
    String primarySku = categoryCode + subCategoryCode;
    String productPart = safeSkuPart(product.getName(), "PRODUCT");
    String attributePart = attributeValues.isEmpty()
        ? "NA"
        : attributeValues.stream()
            .map(attributeValue -> safeSkuPart(attributeValue.getCode(), attributeValue.getId()))
            .collect(Collectors.joining("-"));
    String suffix = String.format("%03d%s", sequence,
        UUID.randomUUID().toString().replace("-", "").substring(0, 4).toUpperCase());
    return String.join("-", primarySku, productPart, attributePart, suffix);
  }

  private String safeSkuPart(String preferred, String fallback) {
    String source = preferred == null || preferred.isBlank() ? fallback : preferred;
    if (source == null) {
      return "NA";
    }
    String normalized = source.trim()
        .toUpperCase()
        .replaceAll("[^A-Z0-9]+", "-")
        .replaceAll("(^-)|(-$)", "");
    return normalized.isBlank() ? "NA" : normalized;
  }

  @Override
  @Transactional(readOnly = true)
  public ProductResponse getProductById(String id) {
    if (id == null || id.isBlank()) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }

    Product product = productRepository.findByIdAndDeletedAtIsNull(id)
        .orElseThrow(() -> new AppException(ErrorCode.INVALID_INPUT));

    return productMapper.toProductResponse(product, List.of());
  }

  @Override
  @Transactional(readOnly = true)
  public ProductResponse getOwnedProductWithVariants(String profileId, String productId) {
    if (productId == null || productId.isBlank() || profileId == null || profileId.isBlank()) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    Product product = productRepository.findByIdWithVariantsGraph(productId.trim())
        .orElseThrow(() -> new AppException(ErrorCode.INVALID_INPUT));
    if (product.getFacility() == null || !profileId.trim().equals(product.getFacility().getOwnerId())) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }
    List<Attribute> attrs = extractAttributesFromProductVariants(product);
    return productMapper.toProductResponse(product, attrs);
  }

  @Override
  @Transactional
  public void uploadProductImages(
      String profileId,
      String id,
      String thumbnailUrl,
      List<String> productImages,
      String videoUrl) {
    if (!StringUtils.hasText(id) || !StringUtils.hasText(profileId)) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    if (!StringUtils.hasText(thumbnailUrl)) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    List<String> gallery = productImages == null ? List.of()
        : productImages.stream().map(String::trim).filter(StringUtils::hasText).toList();

    Product product = productRepository.findByIdAndDeletedAtIsNull(id)
        .orElseThrow(() -> new AppException(ErrorCode.INVALID_INPUT));
    if (product.getFacility() == null || !profileId.equals(product.getFacility().getOwnerId())) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }

    List<ProductMedia> medias = new ArrayList<>();
    medias.add(ProductMedia.builder()
        .product(product)
        .mediaUrl(thumbnailUrl.trim())
        .isThumbnail(true)
        .mediaType(ProductMedia.MediaType.IMAGE)
        .sortOrder(0)
        .build());

    for (int i = 0; i < gallery.size(); i++) {
      medias.add(ProductMedia.builder()
          .product(product)
          .mediaUrl(gallery.get(i))
          .isThumbnail(false)
          .mediaType(ProductMedia.MediaType.IMAGE)
          .sortOrder(i + 1)
          .build());
    }

    if (StringUtils.hasText(videoUrl)) {
      medias.add(ProductMedia.builder()
          .product(product)
          .mediaUrl(videoUrl.trim())
          .isThumbnail(false)
          .mediaType(ProductMedia.MediaType.VIDEO)
          .sortOrder(gallery.size() + 1)
          .build());
    }

    if (product.getMedias() == null) {
      product.setMedias(new ArrayList<>());
    } else {
      product.getMedias().clear();
    }
    product.getMedias().addAll(medias);
    Product savedProduct = productRepository.save(product);
    productSearchService.sync(savedProduct.getId());
    listingSearchService.reindexAllListingsForProduct(savedProduct.getId());
  }

  @Override
  @Transactional
  public void deleteProduct(String id) {
    if (id == null || id.isBlank()) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }

    Product product = productRepository.findByIdAndDeletedAtIsNull(id)
        .orElseThrow(() -> new AppException(ErrorCode.INVALID_INPUT));
    product.setDeletedAt(LocalDateTime.now());
    productRepository.save(product);
    productSearchService.delete(id);
    listingSearchService.deleteListingsIndexByProductId(id);
  }

  @Override
  @Transactional(readOnly = true)
  public List<ProductVariantSummaryResponse> getProductVariants(String profileId, String productId) {
    if (productId == null || productId.isBlank() || profileId == null || profileId.isBlank()) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    Product product = productRepository.findByIdWithVariantsGraph(productId.trim())
        .orElseThrow(() -> new AppException(ErrorCode.INVALID_INPUT));

    if (product.getFacility() == null || !profileId.trim().equals(product.getFacility().getOwnerId())) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }

    return productMapper.toProductVariantSummaryResponses(product.getVariants());
  }
}
