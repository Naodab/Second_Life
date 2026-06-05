package com.naodab.productservice.services.impl;

import java.util.List;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.productservice.dto.request.ListingSearchRequest;
import com.naodab.productservice.dto.response.ListingItemResponse;
import com.naodab.productservice.dto.response.ListingResponse;
import com.naodab.productservice.dto.response.PagedItemsResponse;
import com.naodab.productservice.mapper.ListingMapper;
import com.naodab.productservice.models.Listing;
import com.naodab.productservice.models.ListingVariant;
import com.naodab.productservice.opensearch.OpenSearchNativeQueryHelper;
import com.naodab.productservice.opensearch.OpenSearchSortBy;
import com.naodab.productservice.repositories.ListingRepository;
import com.naodab.productservice.repositories.ListingVariantRepository;
import com.naodab.productservice.services.ListingAdminService;
import com.naodab.productservice.services.ListingSearchService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ListingAdminServiceImpl implements ListingAdminService {

  @NonFinal
  @Value("${default.page-size:20}")
  int defaultListingPageSize;

  ListingRepository listingRepository;
  ListingVariantRepository listingVariantRepository;
  ListingSearchService listingSearchService;
  ListingMapper listingMapper;

  @Override
  @Transactional(readOnly = true)
  public PagedItemsResponse<ListingItemResponse> listPendingListings(Integer page, Integer pageSize) {
    int normalizedPage = OpenSearchNativeQueryHelper.normalizePage(page);
    int normalizedSize = OpenSearchNativeQueryHelper.normalizePageSize(pageSize, defaultListingPageSize);
    ListingSearchRequest searchRequest = ListingSearchRequest.builder()
        .listingStatus(Listing.ListingStatus.PENDING)
        .page(normalizedPage)
        .pageSize(normalizedSize)
        .sortBy(OpenSearchSortBy.CREATED_AT_DESC)
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
  public ListingResponse approveListing(String listingId) {
    Listing listing = requirePendingListing(listingId);
    listing.setListingStatus(Listing.ListingStatus.ACTIVE);
    return persistAndSync(listing);
  }

  @Override
  @Transactional
  public ListingResponse rejectListing(String listingId) {
    Listing listing = requirePendingListing(listingId);
    listing.setListingStatus(Listing.ListingStatus.REJECTED);
    return persistAndSync(listing);
  }

  private Listing requirePendingListing(String listingId) {
    if (!StringUtils.hasText(listingId)) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    Listing listing = listingRepository.findWithProductGraphById(listingId.trim())
        .orElseThrow(() -> new AppException(ErrorCode.INVALID_INPUT));
    if (listing.getListingStatus() != Listing.ListingStatus.PENDING) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    return listing;
  }

  private ListingResponse persistAndSync(Listing listing) {
    Listing saved = listingRepository.save(listing);
    listingRepository.flush();
    Listing indexed = listingRepository.findWithProductGraphById(saved.getId()).orElse(saved);
    listingSearchService.sync(indexed);
    List<ListingVariant> variantEntities = listingVariantRepository.findByListing_Id(saved.getId());
    return listingMapper.toListingResponse(indexed, variantEntities);
  }
}
