package com.naodab.productservice.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.naodab.commonservice.constant.AppConstants;
import com.naodab.commonservice.exception.GlobalExceptionHandler;
import com.naodab.productservice.dto.request.ProductCreateRequest;
import com.naodab.productservice.dto.request.ProductSearchRequest;
import com.naodab.productservice.dto.request.ProductVariantCreateRequest;
import com.naodab.productservice.dto.response.PagedItemsResponse;
import com.naodab.productservice.dto.response.ProductItemResponse;
import com.naodab.productservice.dto.response.ProductResponse;
import com.naodab.productservice.dto.response.PrimarySubcategorySummaryResponse;
import com.naodab.productservice.models.Product.ProductStatus;
import com.naodab.productservice.services.ProductSearchService;
import com.naodab.productservice.services.ProductService;

@WebMvcTest(controllers = ProductController.class)
@TestPropertySource(properties = "server.servlet.context-path=/")
@Import({ GlobalExceptionHandler.class, ProductController.class })
class ProductControllerTest {

  @Autowired
  MockMvc mockMvc;

  @Autowired
  ObjectMapper objectMapper;

  @MockitoBean
  ProductService productService;

  @MockitoBean
  ProductSearchService productSearchService;

  private static ProductResponse dummyProduct(String id, String ownerId) {
    return ProductResponse.builder()
        .id(id)
        .name("Test Product")
        .ownerId(ownerId)
        .status(ProductStatus.PUBLISHED)
        .variants(List.of())
        .attributes(List.of())
        .medias(List.of())
        .subCategories(List.of())
        .build();
  }

  @Test
  void listOwnedProducts_withoutProfileHeader_returnsBadRequest() throws Exception {
    mockMvc.perform(get("/products/owned"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value(1000));

    verify(productSearchService, never()).listOwnedProductItems(any());
  }

  @Test
  void listOwnedProducts_withProfileHeader_setsOwnerIdOnSearchRequest() throws Exception {
    when(productSearchService.listOwnedProductItems(any(ProductSearchRequest.class))).thenAnswer(inv -> {
      ProductSearchRequest r = inv.getArgument(0);
      return PagedItemsResponse.<ProductItemResponse>builder()
          .items(List.of())
          .page(r.getPage() != null ? r.getPage() : 0)
          .pageSize(20)
          .totalCount(0)
          .build();
    });

    mockMvc.perform(
        get("/products/owned")
            .header(AppConstants.HEADER_PROFILE_ID, "  profile-uuid-1  "))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.totalCount").value(0));

    ArgumentCaptor<ProductSearchRequest> cap = ArgumentCaptor.forClass(ProductSearchRequest.class);
    verify(productSearchService).listOwnedProductItems(cap.capture());
    assertThat(cap.getValue().getOwnerId()).isEqualTo("profile-uuid-1");
  }

  @Test
  void listOwnedPrimarySubcategories_withoutProfile_returnsBadRequest() throws Exception {
    mockMvc.perform(get("/products/owned/primary-subcategories"))
        .andExpect(status().isBadRequest());
    verify(productSearchService, never()).listOwnedPrimarySubcategorySummaries(any());
  }

  @Test
  void listOwnedPrimarySubcategories_delegatesToSearchService() throws Exception {
    when(productSearchService.listOwnedPrimarySubcategorySummaries(eq("pid")))
        .thenReturn(List.of(PrimarySubcategorySummaryResponse.builder()
            .id("sc1")
            .name("Shoes")
            .productCount(3)
            .build()));

    mockMvc.perform(get("/products/owned/primary-subcategories")
        .header(AppConstants.HEADER_PROFILE_ID, "pid"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[0].id").value("sc1"));
  }

  @Test
  void reindexProducts_rejectsNonAdmin() throws Exception {
    mockMvc.perform(post("/products/admin/search/reindex")
        .header(AppConstants.JWT_CLAIM_ROLE, "USER"))
        .andExpect(status().isForbidden());

    verify(productSearchService, never()).reindexAllProductsFromDatabase();
  }

  @Test
  void reindexProducts_acceptsAdminRole() throws Exception {
    when(productSearchService.reindexAllProductsFromDatabase()).thenReturn(12);

    mockMvc.perform(post("/products/admin/search/reindex")
        .header(AppConstants.JWT_CLAIM_ROLE, AppConstants.ROLE_ADMIN))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data").value(12));
  }

  @Test
  void createProduct_validatesBodyAndDelegates() throws Exception {
    ProductCreateRequest body = new ProductCreateRequest();
    body.setName("Warm jacket");
    body.setDescription("");
    body.setSubCategoryIds(List.of("sub-1"));
    body.setPrimarySubCategoryId("sub-1");
    body.setAttributeIds(List.of("attr-1"));
    body.setVariants(List.of(ProductVariantCreateRequest.builder()
        .attributeValueIds(List.of("av-1"))
        .build()));

    when(productService.createProduct(eq("owner-x"), any(ProductCreateRequest.class)))
        .thenReturn(dummyProduct("prod-new", "owner-x"));

    mockMvc.perform(
        post("/products")
            .header(AppConstants.HEADER_PROFILE_ID, "owner-x")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.id").value("prod-new"));

    ArgumentCaptor<ProductCreateRequest> cap = ArgumentCaptor.forClass(ProductCreateRequest.class);
    verify(productService).createProduct(eq("owner-x"), cap.capture());
    assertThat(cap.getValue().getName()).isEqualTo("Warm jacket");
  }

  @Test
  void getProduct_withoutProfile_returnsBadRequest() throws Exception {
    mockMvc.perform(get("/products/some-product-id"))
        .andExpect(status().isBadRequest());
    verify(productService, never()).getOwnedProductWithVariants(any(), any());
  }

  @Test
  void getProduct_returnsBody() throws Exception {
    when(productService.getOwnedProductWithVariants(eq("buyer-prof"), eq("pid-99")))
        .thenReturn(dummyProduct("pid-99", "buyer-prof"));

    mockMvc.perform(get("/products/pid-99")
        .header(AppConstants.HEADER_PROFILE_ID, "buyer-prof"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.ownerId").value("buyer-prof"));
  }

  @Test
  void listProductsByOwnerAdmin_requiresAdmin() throws Exception {
    mockMvc.perform(get("/products/admin/by-owner")
        .param("ownerId", "owner-1")
        .header(AppConstants.JWT_CLAIM_ROLE, "USER"))
        .andExpect(status().isForbidden());

    verify(productSearchService, never()).listOwnedProductItems(any());
  }

  @Test
  void listProductsByOwnerAdmin_setsOwnerIdOnRequest() throws Exception {
    when(productSearchService.listOwnedProductItems(any(ProductSearchRequest.class)))
        .thenReturn(PagedItemsResponse.<ProductItemResponse>builder()
            .items(List.of())
            .totalCount(0)
            .page(0)
            .pageSize(20)
            .build());

    mockMvc.perform(get("/products/admin/by-owner")
        .header(AppConstants.JWT_CLAIM_ROLE, AppConstants.ROLE_ADMIN)
        .param("ownerId", "owner-1")
        .param("page", "0")
        .param("pageSize", "20"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.totalCount").value(0));

    ArgumentCaptor<ProductSearchRequest> cap = ArgumentCaptor.forClass(ProductSearchRequest.class);
    verify(productSearchService).listOwnedProductItems(cap.capture());
    assertThat(cap.getValue().getOwnerId()).isEqualTo("owner-1");
  }
}
