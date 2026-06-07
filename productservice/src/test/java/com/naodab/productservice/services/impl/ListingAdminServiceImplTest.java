package com.naodab.productservice.services.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.productservice.dto.request.ListingSearchRequest;
import com.naodab.productservice.dto.response.ListingItemResponse;
import com.naodab.productservice.dto.response.ListingResponse;
import com.naodab.productservice.dto.response.PagedItemsResponse;
import com.naodab.productservice.mapper.ListingMapper;
import com.naodab.productservice.models.Facility;
import com.naodab.productservice.models.Listing;
import com.naodab.productservice.models.Product;
import com.naodab.productservice.repositories.ListingRepository;
import com.naodab.productservice.repositories.ListingVariantRepository;
import com.naodab.productservice.services.ListingSearchService;

@ExtendWith(MockitoExtension.class)
class ListingAdminServiceImplTest {

  @Mock
  ListingRepository listingRepository;

  @Mock
  ListingVariantRepository listingVariantRepository;

  @Mock
  ListingSearchService listingSearchService;

  @Mock
  ListingMapper listingMapper;

  @InjectMocks
  ListingAdminServiceImpl listingAdminService;

  @Test
  void approveListing_setsActive() {
    ReflectionTestUtils.setField(listingAdminService, "defaultListingPageSize", 20);
    Listing listing = pendingListing("lid-1");
    when(listingRepository.findWithProductGraphById("lid-1")).thenReturn(Optional.of(listing));
    when(listingRepository.save(any(Listing.class))).thenAnswer(inv -> inv.getArgument(0));
    when(listingVariantRepository.findByListing_Id("lid-1")).thenReturn(List.of());
    when(listingMapper.toListingResponse(any(), any()))
        .thenReturn(ListingResponse.builder().id("lid-1").listingStatus(Listing.ListingStatus.ACTIVE).build());

    ListingResponse response = listingAdminService.approveListing("lid-1");

    assertThat(response.getListingStatus()).isEqualTo(Listing.ListingStatus.ACTIVE);
    assertThat(listing.getListingStatus()).isEqualTo(Listing.ListingStatus.ACTIVE);
    verify(listingSearchService).sync(listing);
  }

  @Test
  void rejectListing_whenNotPending_throws() {
    Listing listing = pendingListing("lid-1");
    listing.setListingStatus(Listing.ListingStatus.ACTIVE);
    when(listingRepository.findWithProductGraphById("lid-1")).thenReturn(Optional.of(listing));

    assertThatThrownBy(() -> listingAdminService.rejectListing("lid-1"))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);
  }

  @Test
  void suspendListing_setsInactive() {
    Listing listing = pendingListing("lid-1");
    listing.setListingStatus(Listing.ListingStatus.ACTIVE);
    when(listingRepository.findWithProductGraphById("lid-1")).thenReturn(Optional.of(listing));
    when(listingRepository.save(any(Listing.class))).thenAnswer(inv -> inv.getArgument(0));
    when(listingVariantRepository.findByListing_Id("lid-1")).thenReturn(List.of());
    when(listingMapper.toListingResponse(any(), any()))
        .thenReturn(ListingResponse.builder().id("lid-1").listingStatus(Listing.ListingStatus.INACTIVE).build());

    ListingResponse response = listingAdminService.suspendListing("lid-1");

    assertThat(response.getListingStatus()).isEqualTo(Listing.ListingStatus.INACTIVE);
    assertThat(listing.getListingStatus()).isEqualTo(Listing.ListingStatus.INACTIVE);
    verify(listingSearchService).sync(listing);
  }

  @Test
  void reactivateListing_setsActive() {
    Listing listing = pendingListing("lid-1");
    listing.setListingStatus(Listing.ListingStatus.INACTIVE);
    when(listingRepository.findWithProductGraphById("lid-1")).thenReturn(Optional.of(listing));
    when(listingRepository.save(any(Listing.class))).thenAnswer(inv -> inv.getArgument(0));
    when(listingVariantRepository.findByListing_Id("lid-1")).thenReturn(List.of());
    when(listingMapper.toListingResponse(any(), any()))
        .thenReturn(ListingResponse.builder().id("lid-1").listingStatus(Listing.ListingStatus.ACTIVE).build());

    ListingResponse response = listingAdminService.reactivateListing("lid-1");

    assertThat(response.getListingStatus()).isEqualTo(Listing.ListingStatus.ACTIVE);
    assertThat(listing.getListingStatus()).isEqualTo(Listing.ListingStatus.ACTIVE);
    verify(listingSearchService).sync(listing);
  }

  @Test
  void listPendingListings_filtersPendingStatus() {
    ReflectionTestUtils.setField(listingAdminService, "defaultListingPageSize", 20);
    when(listingSearchService.searchListingsPaged(any()))
        .thenReturn(new ListingSearchService.ListingDocumentPage(List.of(), 0));

    listingAdminService.listPendingListings(0, 10);

    org.mockito.ArgumentCaptor<ListingSearchRequest> cap =
        org.mockito.ArgumentCaptor.forClass(ListingSearchRequest.class);
    verify(listingSearchService).searchListingsPaged(cap.capture());
    assertThat(cap.getValue().getListingStatus()).isEqualTo(Listing.ListingStatus.PENDING);
  }

  @Test
  void listListingsByOwner_mapsRepositoryPage() {
    ReflectionTestUtils.setField(listingAdminService, "defaultListingPageSize", 20);
    Listing listing = pendingListing("lid-1");
    when(listingRepository.findAdminPageByOwnerId(
        eq("owner-1"),
        eq(Listing.ListingStatus.ACTIVE),
        any(Pageable.class)))
        .thenReturn(new PageImpl<>(List.of(listing), PageRequest.of(0, 10), 1));
    when(listingMapper.toListingItemResponse(listing))
        .thenReturn(ListingItemResponse.builder()
            .id("lid-1")
            .title("Listing")
            .listingStatus(Listing.ListingStatus.ACTIVE)
            .build());

    PagedItemsResponse<ListingItemResponse> page = listingAdminService.listListingsByOwner(
        " owner-1 ",
        0,
        10,
        Listing.ListingStatus.ACTIVE);

    assertThat(page.getTotalCount()).isEqualTo(1);
    assertThat(page.getItems()).hasSize(1);
    assertThat(page.getItems().getFirst().getId()).isEqualTo("lid-1");
  }

  @Test
  void listListingsByOwner_blankOwnerId_throws() {
    assertThatThrownBy(() -> listingAdminService.listListingsByOwner(" ", 0, 10, null))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);
  }

  private static Listing pendingListing(String id) {
    Product product = Product.builder().id("pid").ownerId("owner").name("Product").build();
    Facility facility = Facility.builder().id("fid").ownerId("owner").name("Facility").build();
    return Listing.builder()
        .id(id)
        .product(product)
        .facility(facility)
        .title("Listing")
        .listingStatus(Listing.ListingStatus.PENDING)
        .build();
  }
}
