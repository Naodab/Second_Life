package com.naodab.productservice.services.impl;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.naodab.productservice.client.UploadFileClient;
import org.springframework.stereotype.Service;

import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.productservice.dto.request.ProductCreateRequest;
import com.naodab.productservice.dto.request.ProductUpdateRequest;
import com.naodab.productservice.dto.request.ProductVariantCreateRequest;
import com.naodab.productservice.dto.response.ProductResponse;
import com.naodab.productservice.mapper.ProductMapper;
import com.naodab.productservice.mapper.ProductVariantMapper;
import com.naodab.productservice.models.Attribute;
import com.naodab.productservice.models.AttributeValue;
import com.naodab.productservice.models.Facility;
import com.naodab.productservice.models.Product;
import com.naodab.productservice.models.ProductSubCategory;
import com.naodab.productservice.models.ProductSubCategoryId;
import com.naodab.productservice.models.ProductVariant;
import com.naodab.productservice.models.SubCategory;
import com.naodab.productservice.repositories.AttributeRepository;
import com.naodab.productservice.repositories.AttributeValueRepository;
import com.naodab.productservice.repositories.FacilityRepository;
import com.naodab.productservice.repositories.ProductRepository;
import com.naodab.productservice.repositories.SubCategoryRepository;
import com.naodab.productservice.services.ProductSearchService;
import com.naodab.productservice.services.ProductService;

import jakarta.transaction.Transactional;
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
  ProductSearchService productSearchService;
  ProductMapper productMapper;
  ProductVariantMapper productVariantMapper;
  UploadFileClient uploadFileClient;

  @Override
  @Transactional
  public ProductResponse createProduct(String profileId, ProductCreateRequest request) {
    Facility facility = getFacilityByOwnerAndId(profileId, request.getFacilityId());
    List<SubCategory> subCategories = getSubCategories(request.getSubCategoryIds());
    SubCategory primarySubCategory = getPrimarySubCategory(request.getPrimarySubCategoryId(), subCategories);
    List<Attribute> attributes = getAttributes(request.getAttributeIds());
    Map<String, AttributeValue> attributeValueById = getAndValidateAttributeValues(request);

    Product product = Product.builder()
        .name(request.getName())
        .description(request.getDescription())
        .facility(facility)
        .primarySubCategory(primarySubCategory)
        .status(Product.ProductStatus.DRAFT)
        .build();

    product.setProductSubCategories(
        subCategories.stream()
            .map(subCategory -> ProductSubCategory.builder()
                .id(new ProductSubCategoryId(null, subCategory.getId()))
                .product(product)
                .subCategory(subCategory)
                .build())
            .collect(Collectors.toList()));

    final int[] sequence = { 1 };
    product.setVariants(request.getVariants().stream()
        .map(variantRequest -> toProductVariant(product, variantRequest, attributeValueById, sequence[0]++))
        .toList());

    Product savedProduct = productRepository.save(product);
    for (ProductSubCategory productSubCategory : savedProduct.getProductSubCategories()) {
      productSubCategory
          .setId(new ProductSubCategoryId(savedProduct.getId(), productSubCategory.getSubCategory().getId()));
    }

    productSearchService.sync(savedProduct);
    return productMapper.toProductResponse(savedProduct, attributes);
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
    List<SubCategory> subCategories = getSubCategories(request.getSubCategoryIds());
    SubCategory primarySubCategory = getPrimarySubCategory(request.getPrimarySubCategoryId(), subCategories);
    List<Attribute> attributes = getAttributes(request.getAttributeIds());
    Map<String, AttributeValue> attributeValueById = getAndValidateAttributeValuesForUpdate(request);

    product.setName(request.getName());
    product.setDescription(request.getDescription());
    product.setFacility(facility);
    product.setPrimarySubCategory(primarySubCategory);

    product.getProductSubCategories().clear();
    product.getProductSubCategories().addAll(
        subCategories.stream()
            .map(subCategory -> ProductSubCategory.builder()
                .id(new ProductSubCategoryId(product.getId(), subCategory.getId()))
                .product(product)
                .subCategory(subCategory)
                .build())
            .toList());

    final int[] sequence = { 1 };
    product.getVariants().clear();
    product.getVariants().addAll(request.getVariants().stream()
        .map(variantRequest -> toProductVariant(product, variantRequest, attributeValueById, sequence[0]++))
        .toList());

    Product savedProduct = productRepository.save(product);
    productSearchService.sync(savedProduct);
    return productMapper.toProductResponse(savedProduct, attributes);
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

  private Map<String, AttributeValue> getAndValidateAttributeValues(ProductCreateRequest request) {
    Set<String> requestedAttributeIds = new HashSet<>(request.getAttributeIds());
    List<String> requestedAttributeValueIds = request.getVariants().stream()
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

  private Map<String, AttributeValue> getAndValidateAttributeValuesForUpdate(ProductUpdateRequest request) {
    Set<String> requestedAttributeIds = new HashSet<>(request.getAttributeIds());
    List<String> requestedAttributeValueIds = request.getVariants().stream()
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
  public ProductResponse getProductById(String id) {
    if (id == null || id.isBlank()) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }

    Product product = productRepository.findByIdAndDeletedAtIsNull(id)
        .orElseThrow(() -> new AppException(ErrorCode.INVALID_INPUT));

    return productMapper.toProductResponse(product, List.of());
  }

  @Override
  public void uploadProductImages(
      String profileId,
      String id,
      MultipartFile thumbnailImage,
      List<MultipartFile> productImages) {
    if (!StringUtils.hasText(id) || !StringUtils.hasText(profileId)) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    if (thumbnailImage == null || thumbnailImage.isEmpty()) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    if (CollectionUtils.isEmpty(productImages) || productImages.stream().anyMatch(MultipartFile::isEmpty)) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }

    Product product = productRepository.findByIdAndDeletedAtIsNull(id)
        .orElseThrow(() -> new AppException(ErrorCode.INVALID_INPUT));
    if (product.getFacility() == null || !profileId.equals(product.getFacility().getOwnerId())) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }

    uploadFileClient.uploadProductImages(id, thumbnailImage, productImages);
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
  }
}
