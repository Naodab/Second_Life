package com.naodab.productservice.services.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.productservice.dto.request.ProductUpdateRequest;
import com.naodab.productservice.dto.response.ProductResponse;
import com.naodab.productservice.mapper.ProductMapper;
import com.naodab.productservice.mapper.ProductVariantMapper;
import com.naodab.productservice.models.Product;
import com.naodab.productservice.models.SubCategory;
import com.naodab.productservice.repositories.AttributeRepository;
import com.naodab.productservice.repositories.AttributeValueRepository;
import com.naodab.productservice.repositories.ListingVariantRepository;
import com.naodab.productservice.repositories.ProductRepository;
import com.naodab.productservice.repositories.SubCategoryRepository;
import com.naodab.productservice.services.ListingSearchService;
import com.naodab.productservice.services.ProductSearchService;

@ExtendWith(MockitoExtension.class)
class ProductServiceImplTest {

  @Mock
  ProductRepository productRepository;

  @Mock
  SubCategoryRepository subCategoryRepository;

  @Mock
  AttributeRepository attributeRepository;

  @Mock
  AttributeValueRepository attributeValueRepository;

  @Mock
  ListingVariantRepository listingVariantRepository;

  @Mock
  ProductSearchService productSearchService;

  @Mock
  ListingSearchService listingSearchService;

  @Mock
  ProductMapper productMapper;

  @Mock
  ProductVariantMapper productVariantMapper;

  @InjectMocks
  ProductServiceImpl productService;

  @Test
  void getProductById_blank_throwsInvalidInput() {
    assertThatThrownBy(() -> productService.getProductById(null))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);
    assertThatThrownBy(() -> productService.getProductById("   "))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);
    verify(productRepository, never()).findByIdAndDeletedAtIsNull(any());
  }

  @Test
  void getProductById_found_returnsMappedResponse() {
    Product p = minimalPublishedProduct();
    ProductResponse resp =
        ProductResponse.builder().id(p.getId()).ownerId(p.getOwnerId()).name("x").status(p.getStatus())
            .variants(List.of())
            .attributes(List.of()).medias(List.of()).subCategories(List.of()).build();
    when(productRepository.findByIdAndDeletedAtIsNull("p1")).thenReturn(Optional.of(p));
    when(productMapper.toProductResponse(p, List.of())).thenReturn(resp);
    assertThat(productService.getProductById("p1")).isSameAs(resp);
  }

  @Test
  void deleteProduct_callsSearchDeleteAndListingIndexDeleteByProductId() {
    Product p = minimalPublishedProduct();
    when(productRepository.findByIdAndDeletedAtIsNull("p1")).thenReturn(Optional.of(p));
    when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

    productService.deleteProduct("p1");

    verify(productSearchService).delete("p1");
    verify(listingSearchService).deleteListingsIndexByProductId("p1");
  }

  @Test
  void getOwnedProductWithVariants_whenOwnerMismatch_throwsUnauthorized() {
    Product p = minimalPublishedProduct();
    when(productRepository.findByIdWithVariantsGraph("pid")).thenReturn(Optional.of(p));
    assertThatThrownBy(() -> productService.getOwnedProductWithVariants("other", "pid"))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.UNAUTHORIZED);
    verify(productMapper, never()).toProductResponse(any(), any());
  }

  @Test
  void publishDraftProduct_whenNotDraft_throwsInvalidInput() {
    Product draftLike = minimalPublishedProduct();
    draftLike.setStatus(Product.ProductStatus.PUBLISHED);
    when(productRepository.findByIdAndDeletedAtIsNull("p9")).thenReturn(Optional.of(draftLike));
    assertThatThrownBy(() -> productService.publishDraftProduct("owner1", "p9"))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);
  }

  @Test
  void updateProduct_blankId_throws() {
    assertThatThrownBy(() ->
        productService.updateProduct("prof", "", new ProductUpdateRequest()))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);
    verify(productRepository, never()).findByIdAndDeletedAtIsNull(any());
  }

  @Test
  void uploadProductImages_whenThumbnailBlank_throws() {
    assertThatThrownBy(() ->
        productService.uploadProductImages("owner1", "p1", null, List.of(), null))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);
    verify(productRepository, never()).save(any());
  }

  private Product minimalPublishedProduct() {
    SubCategory sc = new SubCategory();
    sc.setId("sc");
    return Product.builder()
        .id("p1")
        .name("n")
        .ownerId("owner1")
        .primarySubCategory(sc)
        .status(Product.ProductStatus.PUBLISHED)
        .build();
  }
}
