package com.naodab.productservice.services.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.productservice.documents.ListingDocument;
import com.naodab.productservice.dto.request.ListingCreateRequest;
import com.naodab.productservice.dto.request.ListingSearchRequest;
import com.naodab.productservice.dto.request.ListingUpdateRequest;
import com.naodab.productservice.dto.response.ListingItemResponse;
import com.naodab.productservice.dto.response.ListingSuggestionResponse;
import com.naodab.productservice.mapper.FacilityMapper;
import com.naodab.productservice.mapper.ListingMapper;
import com.naodab.productservice.mapper.ProductMapper;
import com.naodab.productservice.models.Facility;
import com.naodab.productservice.models.Listing;
import com.naodab.productservice.models.Product;
import com.naodab.productservice.models.Product.ProductStatus;
import com.naodab.productservice.repositories.FacilityRepository;
import com.naodab.productservice.repositories.ListingRepository;
import com.naodab.productservice.repositories.ListingVariantRepository;
import com.naodab.productservice.repositories.ProductRepository;
import com.naodab.productservice.repositories.ProductVariantRepository;
import com.naodab.productservice.elasticsearch.ElasticsearchSortBy;
import com.naodab.productservice.services.ListingSearchService;

@ExtendWith(MockitoExtension.class)
class ListingServiceImplTest {

  @Mock
  ListingRepository listingRepository;

  @Mock
  ListingVariantRepository listingVariantRepository;

  @Mock
  ProductRepository productRepository;

  @Mock
  ProductVariantRepository productVariantRepository;

  @Mock
  FacilityRepository facilityRepository;

  @Mock
  ListingSearchService listingSearchService;

  @Mock
  ListingMapper listingMapper;

  @Mock
  ProductMapper productMapper;

  @Mock
  FacilityMapper facilityMapper;

  @InjectMocks
  ListingServiceImpl listingService;

  @BeforeEach
  void injectPageSizeDefault() {
    ReflectionTestUtils.setField(listingService, "defaultListingPageSize", 20);
  }

  @Test
  void getPublicListingById_blank_throwsInvalidInput() {
    assertThatThrownBy(() -> listingService.getPublicListingById(null))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);
    verify(listingRepository, never()).findWithProductGraphById(any());
  }

  @Test
  void getPublicListingById_whenProductNotPublished_throws() {
    Product product = minimalProduct("pub", ProductStatus.DRAFT);
    Listing listing = minimalListing(product, Listing.ListingStatus.ACTIVE);
    when(listingRepository.findWithProductGraphById("lid")).thenReturn(Optional.of(listing));

    assertThatThrownBy(() -> listingService.getPublicListingById("lid"))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);
  }

  @Test
  void getPublicListingById_whenListingNotActive_throws() {
    Product product = minimalProduct("pub", ProductStatus.PUBLISHED);
    Listing listing = minimalListing(product, Listing.ListingStatus.PENDING);
    when(listingRepository.findWithProductGraphById("lid")).thenReturn(Optional.of(listing));

    assertThatThrownBy(() -> listingService.getPublicListingById("lid"))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);
  }

  @Test
  void suggestSearch_blankKeyword_returnsEmpty() {
    assertThat(listingService.suggestSearch("  ", 5)).isEmpty();
    verify(listingSearchService, never()).searchListingsPaged(any());
  }

  @Test
  void suggestSearch_deduplicatesTitles() {
    ListingDocument doc1 = ListingDocument.builder()
        .id("l1")
        .title(" Winter Boot ")
        .productId("p1")
        .build();
    ListingDocument doc2 = ListingDocument.builder()
        .id("l2")
        .title("  winter BOOT ")
        .productId("p1")
        .build();
    ListingItemResponse item1 = ListingItemResponse.builder().id("l1").title(" Winter Boot ").productId("p1").build();
    ListingItemResponse item2 = ListingItemResponse.builder().id("l2").title("winter boot").productId("p2").build();
    when(listingSearchService.searchListingsPaged(any()))
        .thenReturn(new ListingSearchService.ListingDocumentPage(List.of(doc1, doc2), 2));
    when(listingMapper.toListingItemResponse(doc1)).thenReturn(item1);
    when(listingMapper.toListingItemResponse(doc2)).thenReturn(item2);

    List<ListingSuggestionResponse> out = listingService.suggestSearch("boot", 5);

    assertThat(out).extracting(ListingSuggestionResponse::getTitle).containsExactly("Winter Boot");
    verify(listingSearchService).searchListingsPaged(any());
  }

  @Test
  void searchPublicListingItems_setsDefaultsAndMapsDocuments() {
    ListingDocument doc = ListingDocument.builder().id("l1").productId("p1").title("t").build();
    ListingItemResponse item = ListingItemResponse.builder().id("l1").productId("p1").title("t").build();
    when(listingSearchService.searchListingsPaged(any())).thenAnswer(inv -> {
      ListingSearchRequest r = inv.getArgument(0);
      assertThat(r.getListingStatus()).isEqualTo(Listing.ListingStatus.ACTIVE);
      assertThat(r.getProductStatus()).isEqualTo(ProductStatus.PUBLISHED);
      assertThat(r.getKeyword()).isNull();
      return new ListingSearchService.ListingDocumentPage(List.of(doc), 1);
    });
    when(listingMapper.toListingItemResponse(doc)).thenReturn(item);

    var page = listingService.searchPublicListingItems(
        ListingSearchRequest.builder().keyword("   ").sortBy(null).page(null).pageSize(null).build());

    assertThat(page.getTotalCount()).isEqualTo(1);
    assertThat(page.getItems()).containsExactly(item);
    assertThat(page.getPageSize()).isEqualTo(20);
  }

  @Test
  void listListingItemsForFacility_facilityNotFound_throws() {
    when(facilityRepository.findByOwnerIdAndIdAndDeletedAtIsNull("profile", "f1")).thenReturn(Optional.empty());
    assertThatThrownBy(
        () -> listingService.listListingItemsForFacility("profile", "f1", 0, 10, null, null))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FACILITY_NOT_FOUND);
    verify(listingSearchService, never()).searchListingsPaged(any());
  }

  @Test
  void createListing_whenNotProductOwner_throwsUnauthorized() {
    ListingCreateRequest req = new ListingCreateRequest();
    req.setProductId("prod");
    req.setFacilityId("fac");
    req.setTitle("Listing");
    req.setListingType(Listing.ListingType.BUY);
    Product otherOwner = minimalProduct("stranger", ProductStatus.PUBLISHED);
    Facility fac = Facility.builder().id("fac").build();
    when(productRepository.findByIdAndDeletedAtIsNull("prod")).thenReturn(Optional.of(otherOwner));
    when(facilityRepository.findByOwnerIdAndIdAndDeletedAtIsNull("me", "fac")).thenReturn(Optional.of(fac));

    assertThatThrownBy(() -> listingService.createListing("me", req))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.UNAUTHORIZED);
    verify(listingRepository, never()).save(any());
  }

  @Test
  void updateListing_whenNoMutableFieldsProvided_throws() {
    assertThatThrownBy(() -> listingService.updateListing("p", "lid", new ListingUpdateRequest()))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_INPUT);
    verify(listingRepository, never()).findWithProductGraphById(any());
  }

  @Test
  void listListingItemsForFacility_whenKeywordProvided_usesRelevanceSort() {
    when(facilityRepository.findByOwnerIdAndIdAndDeletedAtIsNull("prof", "f1"))
        .thenReturn(Optional.of(Facility.builder().id("f1").build()));
    when(listingSearchService.searchListingsPaged(any()))
        .thenReturn(new ListingSearchService.ListingDocumentPage(List.of(), 0));
    ArgumentCaptor<ListingSearchRequest> cap = ArgumentCaptor.forClass(ListingSearchRequest.class);

    listingService.listListingItemsForFacility("prof", "f1", 0, 10, "shoes ", null);

    verify(listingSearchService).searchListingsPaged(cap.capture());
    assertThat(cap.getValue().getSortBy()).isEqualTo(ElasticsearchSortBy.RELEVANCE);
    assertThat(cap.getValue().getKeyword()).isEqualTo("shoes");
  }

  private static Product minimalProduct(String ownerId, ProductStatus status) {
    var sc = new com.naodab.productservice.models.SubCategory();
    sc.setId("sc");

    return Product.builder()
        .id("p1")
        .name("n")
        .ownerId(ownerId)
        .primarySubCategory(sc)
        .status(status)
        .build();
  }

  private static Listing minimalListing(Product product, Listing.ListingStatus listingStatus) {
    Facility facility = Facility.builder().id("f1").build();
    return Listing.builder()
        .id("lid")
        .product(product)
        .facility(facility)
        .title("t")
        .listingStatus(listingStatus)
        .build();
  }
}
