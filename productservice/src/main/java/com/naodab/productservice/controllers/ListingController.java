package com.naodab.productservice.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.naodab.commonservice.constant.AppConstants;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.commonservice.response.ApiResponse;
import com.naodab.productservice.dto.request.ListingCreateRequest;
import com.naodab.productservice.dto.request.ListingRecommendationRequest;
import com.naodab.productservice.dto.request.ListingUpdateRequest;
import com.naodab.productservice.dto.request.ListingSearchRequest;
import com.naodab.productservice.dto.response.AdminListingPurgeResponse;
import com.naodab.productservice.dto.response.ListingItemResponse;
import com.naodab.productservice.dto.response.ListingPublicDetailResponse;
import com.naodab.productservice.dto.response.ListingSuggestionResponse;
import com.naodab.productservice.dto.response.ListingResponse;
import com.naodab.productservice.dto.response.PagedItemsResponse;
import com.naodab.productservice.services.ListingAdminPurgeService;
import com.naodab.productservice.services.ListingRecommendationService;
import com.naodab.productservice.services.ListingSearchService;
import com.naodab.productservice.services.ListingService;
import com.naodab.productservice.services.SearchHistoryAsyncRecorder;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/listings")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class ListingController {

  ListingService listingService;
  ListingSearchService listingSearchService;
  SearchHistoryAsyncRecorder searchHistoryAsyncRecorder;
  ListingRecommendationService listingRecommendationService;
  ListingAdminPurgeService listingAdminPurgeService;

  @PostMapping("/admin/purge-all")
  public ResponseEntity<ApiResponse<AdminListingPurgeResponse>> purgeAllListingsAdmin(
      @RequestHeader(value = AppConstants.JWT_CLAIM_ROLE, required = false) String role) {
    if (!AppConstants.ROLE_ADMIN.equals(role)) {
      throw new AppException(ErrorCode.FORBIDDEN);
    }
    AdminListingPurgeResponse body =
        listingAdminPurgeService.purgeAllListingsAndSearchIndexAndRemoteInventory(role);
    log.warn("Admin purge-all listings completed: {}", body);
    return ResponseEntity.ok(ApiResponse.<AdminListingPurgeResponse>builder().data(body).build());
  }

  @PostMapping("/admin/search/reindex")
  public ResponseEntity<ApiResponse<Integer>> reindexListingsForSearch(
      @RequestHeader(value = AppConstants.JWT_CLAIM_ROLE, required = false) String role) {
    if (!AppConstants.ROLE_ADMIN.equals(role)) {
      throw new AppException(ErrorCode.FORBIDDEN);
    }
    int count = listingSearchService.reindexAllListingsFromDatabase();
    log.info("Listing search index reindexed: {} documents", count);
    return ResponseEntity.ok(ApiResponse.<Integer>builder().data(count).build());
  }

  @GetMapping("/search")
  public ResponseEntity<ApiResponse<PagedItemsResponse<ListingItemResponse>>> searchListingItems(
      @ModelAttribute ListingSearchRequest request,
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader) {
    var data = listingService.searchPublicListingItems(request);
    if (profileIdHeader != null && !profileIdHeader.isBlank()) {
      searchHistoryAsyncRecorder.recordListingSearchAsync(profileIdHeader.trim(), request);
    }
    return ResponseEntity.ok(ApiResponse.<PagedItemsResponse<ListingItemResponse>>builder()
        .data(data)
        .build());
  }

  @GetMapping("/suggestions")
  public ResponseEntity<ApiResponse<List<ListingSuggestionResponse>>> searchSuggestions(
      @RequestParam(required = false) String keyword,
      @RequestParam(required = false) Integer limit) {
    return ResponseEntity.ok(ApiResponse.<List<ListingSuggestionResponse>>builder()
        .data(listingService.suggestSearch(keyword, limit))
        .build());
  }

  @PostMapping("/recommendations")
  public ResponseEntity<ApiResponse<List<ListingItemResponse>>> recommendListings(
      @RequestBody(required = false) @Valid ListingRecommendationRequest body,
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader) {
    String profileId = profileIdHeader == null || profileIdHeader.isBlank() ? null : profileIdHeader.trim();
    return ResponseEntity.ok(
        ApiResponse.<List<ListingItemResponse>>builder()
            .data(listingRecommendationService.recommend(profileId, body))
            .build());
  }

  @GetMapping("/by-facility/{facilityId}")
  public ResponseEntity<ApiResponse<PagedItemsResponse<ListingItemResponse>>> listListingsForFacility(
      @PathVariable String facilityId,
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer pageSize,
      @RequestParam(required = false) String keyword,
      @RequestParam(required = false) String productId,
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader) {
    String profileId = validateProfileId(profileIdHeader);
    return ResponseEntity.ok(ApiResponse.<PagedItemsResponse<ListingItemResponse>>builder()
        .data(listingService.listListingItemsForFacility(profileId, facilityId, page, pageSize, keyword, productId))
        .build());
  }

  @GetMapping("/{id}")
  public ResponseEntity<ApiResponse<ListingPublicDetailResponse>> getPublicListingById(
      @PathVariable String id,
      @RequestParam(name = "listingVariantId", required = false) String listingVariantId) {
    if (listingVariantId != null && !listingVariantId.isBlank()) {
      listingService.assertListingVariantOnListing(id, listingVariantId);
    }
    return ResponseEntity.ok(ApiResponse.<ListingPublicDetailResponse>builder()
        .data(listingService.getPublicListingById(id))
        .build());
  }

  @PostMapping
  public ResponseEntity<ApiResponse<ListingResponse>> createListing(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader,
      @RequestBody @Valid ListingCreateRequest request) {
    String profileId = validateProfileId(profileIdHeader);
    return ResponseEntity.ok(ApiResponse.<ListingResponse>builder()
        .data(listingService.createListing(profileId, request))
        .build());
  }

  @PutMapping("/{id}")
  public ResponseEntity<ApiResponse<ListingResponse>> updateListing(
      @PathVariable String id,
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader,
      @RequestBody @Valid ListingUpdateRequest request) {
    String profileId = validateProfileId(profileIdHeader);
    return ResponseEntity.ok(ApiResponse.<ListingResponse>builder()
        .data(listingService.updateListing(profileId, id, request))
        .build());
  }

  private String validateProfileId(String profileIdHeader) {
    if (profileIdHeader == null || profileIdHeader.isBlank()) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    return profileIdHeader.trim();
  }
}
