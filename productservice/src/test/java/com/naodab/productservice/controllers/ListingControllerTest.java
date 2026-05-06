package com.naodab.productservice.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
import com.naodab.productservice.dto.request.ListingCreateRequest;
import com.naodab.productservice.dto.request.ListingSearchRequest;
import com.naodab.productservice.dto.response.ListingItemResponse;
import com.naodab.productservice.dto.response.ListingPublicDetailResponse;
import com.naodab.productservice.dto.response.ListingResponse;
import com.naodab.productservice.dto.response.PagedItemsResponse;
import com.naodab.productservice.dto.response.ProductResponse;
import com.naodab.productservice.models.Listing.ListingStatus;
import com.naodab.productservice.models.Listing.ListingType;
import com.naodab.productservice.models.Product.ProductStatus;
import com.naodab.productservice.services.ListingRecommendationService;
import com.naodab.productservice.services.ListingSearchService;
import com.naodab.productservice.services.ListingService;
import com.naodab.productservice.services.SearchHistoryAsyncRecorder;

@WebMvcTest(controllers = ListingController.class)
@TestPropertySource(properties = "server.servlet.context-path=/")
@Import({ GlobalExceptionHandler.class, ListingController.class })
class ListingControllerTest {

  @Autowired
  MockMvc mockMvc;

  @Autowired
  ObjectMapper objectMapper;

  @MockitoBean
  ListingService listingService;

  @MockitoBean
  ListingSearchService listingSearchService;

  @MockitoBean
  SearchHistoryAsyncRecorder searchHistoryAsyncRecorder;

  @MockitoBean
  ListingRecommendationService listingRecommendationService;

  @Test
  void getPublicListingById_delegates() throws Exception {
    ListingPublicDetailResponse detail = ListingPublicDetailResponse.builder()
        .listing(ListingResponse.builder()
            .id("lid")
            .productId("pid")
            .facilityId("fid")
            .title("Áo ấm")
            .listingType(ListingType.BUY)
            .listingStatus(ListingStatus.ACTIVE)
            .variants(List.of())
            .build())
        .product(ProductResponse.builder()
            .id("pid")
            .name("Áo len")
            .ownerId("owner1")
            .status(ProductStatus.PUBLISHED)
            .variants(List.of())
            .attributes(List.of())
            .medias(List.of())
            .subCategories(List.of())
            .build())
        .build();
    when(listingService.getPublicListingById("listing-uuid")).thenReturn(detail);

    mockMvc.perform(get("/listings/listing-uuid"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.listing.id").value("lid"))
        .andExpect(jsonPath("$.data.product.ownerId").value("owner1"));
  }

  @Test
  void searchListingItems_callsAsyncRecorder_whenProfileProvided() throws Exception {
    PagedItemsResponse<ListingItemResponse> emptyPage = PagedItemsResponse.<ListingItemResponse>builder()
        .items(List.of())
        .totalCount(0)
        .page(0)
        .pageSize(20)
        .build();
    when(listingService.searchPublicListingItems(any())).thenReturn(emptyPage);

    mockMvc.perform(get("/listings/search")
        .header(AppConstants.HEADER_PROFILE_ID, " prof-1 ")
        .param("keyword", "giày"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.totalCount").value(0));

    ArgumentCaptor<ListingSearchRequest> cap = ArgumentCaptor.forClass(ListingSearchRequest.class);
    verify(searchHistoryAsyncRecorder).recordListingSearchAsync(eq("prof-1"), cap.capture());
    assertThat(cap.getValue().getKeyword()).isEqualTo("giày");
  }

  @Test
  void searchListingItems_withoutProfile_skipsRecorder() throws Exception {
    when(listingService.searchPublicListingItems(any())).thenReturn(
        PagedItemsResponse.<ListingItemResponse>builder()
            .items(List.of())
            .totalCount(0)
            .page(0)
            .pageSize(20)
            .build());

    mockMvc.perform(get("/listings/search"))
        .andExpect(status().isOk());

    verify(searchHistoryAsyncRecorder, never()).recordListingSearchAsync(any(), any());
  }

  @Test
  void listByFacility_requiresProfile() throws Exception {
    mockMvc.perform(get("/listings/by-facility/fac-1"))
        .andExpect(status().isBadRequest());
    verify(listingService, never()).listListingItemsForFacility(any(), any(), any(), any(), any(), any());
  }

  @Test
  void listByFacility_delegates() throws Exception {
    when(listingService.listListingItemsForFacility(
        eq("p1"), eq("fac-1"), eq(0), eq(10), eq("kw"), eq("prod-99")))
        .thenReturn(PagedItemsResponse.<ListingItemResponse>builder()
            .items(List.of()).totalCount(0).page(0).pageSize(10).build());

    mockMvc.perform(get("/listings/by-facility/fac-1")
        .header(AppConstants.HEADER_PROFILE_ID, "p1")
        .param("page", "0")
        .param("pageSize", "10")
        .param("keyword", "kw")
        .param("productId", "prod-99"))
        .andExpect(status().isOk());
  }

  @Test
  void createListing_requiresProfile() throws Exception {
    ListingCreateRequest body = new ListingCreateRequest();
    body.setProductId("prod");
    body.setFacilityId("fac");
    body.setTitle("Bán máy giặt");
    body.setListingType(ListingType.BUY);

    mockMvc.perform(post("/listings")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isBadRequest());
    verify(listingService, never()).createListing(any(), any());
  }

  @Test
  void createListing_delegates() throws Exception {
    ListingCreateRequest body = new ListingCreateRequest();
    body.setProductId("prod");
    body.setFacilityId("fac");
    body.setTitle("Bán máy giặt");
    body.setListingType(ListingType.BUY);

    when(listingService.createListing(eq("seller"), any(ListingCreateRequest.class)))
        .thenAnswer(inv -> ListingResponse.builder()
            .id("new-lid")
            .productId("prod")
            .facilityId("fac")
            .title("Bán máy giặt")
            .listingType(ListingType.BUY)
            .listingStatus(ListingStatus.PENDING)
            .variants(List.of())
            .build());

    mockMvc.perform(post("/listings")
        .header(AppConstants.HEADER_PROFILE_ID, "seller")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.id").value("new-lid"));

    verify(listingService).createListing(eq("seller"), any(ListingCreateRequest.class));
  }

  @Test
  void reindexListings_requiresAdmin() throws Exception {
    mockMvc.perform(post("/listings/admin/search/reindex")
        .header(AppConstants.JWT_CLAIM_ROLE, "USER"))
        .andExpect(status().isForbidden());
    verify(listingSearchService, never()).reindexAllListingsFromDatabase();
  }

  @Test
  void reindexListings_adminOk() throws Exception {
    when(listingSearchService.reindexAllListingsFromDatabase()).thenReturn(5);

    mockMvc.perform(post("/listings/admin/search/reindex")
        .header(AppConstants.JWT_CLAIM_ROLE, AppConstants.ROLE_ADMIN))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data").value(5));
  }

  @Test
  void updateListing_requiresProfile() throws Exception {
    mockMvc.perform(
        put("/listings/x1")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{}"))
        .andExpect(status().isBadRequest());
    verify(listingService, never()).updateListing(any(), any(), any());
  }
}
