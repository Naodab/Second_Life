package com.naodab.productservice.services.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.query.Query;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.mapping.IndexCoordinates;
import org.springframework.test.util.ReflectionTestUtils;

import com.naodab.productservice.documents.ListingDocument;
import com.naodab.productservice.dto.request.ListingSearchRequest;
import com.naodab.productservice.models.Listing;
import com.naodab.productservice.repositories.ListingRepository;
import com.naodab.productservice.services.ListingSearchService;

@ExtendWith(MockitoExtension.class)
class ListingSearchServiceImplTest {

  static final int BATCH = 50;

  @Mock
  ElasticsearchOperations openSearchOperations;

  @Mock
  ListingOpenSearchIndexWriter listingOpenSearchIndexWriter;

  @Mock
  ListingRepository listingRepository;

  @InjectMocks
  ListingSearchServiceImpl listingSearchService;

  @BeforeEach
  void injectPageSize() {
    ReflectionTestUtils.setField(listingSearchService, "defaultPageSize", 15);
  }

  @Test
  void sync_nullListing_orBlankId_returnsWithoutWriting() {
    listingSearchService.sync(null);
    Listing blank = new Listing();
    blank.setId("   ");
    listingSearchService.sync(blank);
    verify(listingOpenSearchIndexWriter, never()).writeListingDocumentById(any());
  }

  @Test
  void sync_swallowsWriterFailure() {
    Listing listing = new Listing();
    listing.setId("l1");
    doThrow(new RuntimeException("boom")).when(listingOpenSearchIndexWriter).writeListingDocumentById("l1");
    assertThatCode(() -> listingSearchService.sync(listing)).doesNotThrowAnyException();
  }

  @Test
  void delete_blankSkipped() {
    listingSearchService.delete(null);
    listingSearchService.delete("  ");
    verify(openSearchOperations, never()).delete(any(), any(IndexCoordinates.class));
  }

  @Test
  void delete_trimsAndDeletesDocument() {
    listingSearchService.delete("  lx  ");
    verify(openSearchOperations).delete(eq("lx"), eq(IndexCoordinates.of("listings")));
  }

  @Test
  void reindexAllListingsForProduct_blankSkipped() {
    listingSearchService.reindexAllListingsForProduct(null);
    listingSearchService.reindexAllListingsForProduct("   ");
    verify(listingOpenSearchIndexWriter, never()).writeListingDocumentById(any());
  }

  @Test
  void reindexAllListingsForProduct_writesEachListingIdForProduct() {
    when(listingRepository.findIdsByProductId("p1")).thenReturn(List.of("l1", "l2"));

    listingSearchService.reindexAllListingsForProduct(" p1 ");

    verify(listingOpenSearchIndexWriter).writeListingDocumentById("l1");
    verify(listingOpenSearchIndexWriter).writeListingDocumentById("l2");
  }

  @Test
  void deleteListingsIndexByProductId_deletesEveryListingHit() {
    when(listingRepository.findListingIdsByProductId("p9")).thenReturn(List.of("a", "b"));

    listingSearchService.deleteListingsIndexByProductId("p9");

    verify(openSearchOperations).delete("a", IndexCoordinates.of("listings"));
    verify(openSearchOperations).delete("b", IndexCoordinates.of("listings"));
  }

  @Test
  void searchListingsPaged_returnsTotalAndContents() {
    ListingDocument doc = ListingDocument.builder().id("lid").productId("p").title("t").build();
    @SuppressWarnings("unchecked")
    SearchHit<ListingDocument> sh = mock(SearchHit.class);
    when(sh.getContent()).thenReturn(doc);
    @SuppressWarnings("unchecked")
    SearchHits<ListingDocument> hits = mock(SearchHits.class);
    List<SearchHit<ListingDocument>> hitList = List.of(sh);
    when(hits.getTotalHits()).thenReturn(1L);
    when(hits.iterator()).thenAnswer(inv -> hitList.iterator());

    when(openSearchOperations.search(any(Query.class), eq(ListingDocument.class),
        eq(IndexCoordinates.of("listings")))).thenReturn(hits);

    ListingSearchService.ListingDocumentPage page =
        listingSearchService.searchListingsPaged(ListingSearchRequest.builder().page(2).pageSize(5).build());

    assertThat(page.totalCount()).isEqualTo(1L);
    assertThat(page.items()).containsExactly(doc);
    verify(openSearchOperations).search(any(Query.class), eq(ListingDocument.class),
        eq(IndexCoordinates.of("listings")));
  }

  @Test
  void removeAllListingDocumentsFromIndex_pagesAndDeletes() {
    PageRequest pg0 = PageRequest.of(0, 500);
    PageRequest pg1 = PageRequest.of(1, 500);
    var first = new PageImpl<>(List.of("a", "b"), pg0, 600);
    var second = new PageImpl<>(List.of("c"), pg1, 600);
    when(listingRepository.findAllListingIds(pg0)).thenReturn(first);
    when(listingRepository.findAllListingIds(pg1)).thenReturn(second);

    long n = listingSearchService.removeAllListingDocumentsFromIndex();

    assertThat(n).isEqualTo(3);
    verify(openSearchOperations).delete("a", IndexCoordinates.of("listings"));
    verify(openSearchOperations).delete("b", IndexCoordinates.of("listings"));
    verify(openSearchOperations).delete("c", IndexCoordinates.of("listings"));
  }

  @Test
  void reindexAllListingsFromDatabase_iteratesUntilEmptyBatch() {
    PageRequest pg0 = PageRequest.of(0, BATCH);
    PageRequest pg1 = PageRequest.of(1, BATCH);
    var first = new PageImpl<>(List.of("l1"), pg0, 51);
    var second = new PageImpl<>(List.of("l2"), pg1, 51);
    when(listingRepository.findIdsForOpenSearchReindex(pg0)).thenReturn(first);
    when(listingRepository.findIdsForOpenSearchReindex(pg1)).thenReturn(second);

    int total = listingSearchService.reindexAllListingsFromDatabase();

    assertThat(total).isEqualTo(2);
    verify(listingOpenSearchIndexWriter).writeListingDocumentById("l1");
    verify(listingOpenSearchIndexWriter).writeListingDocumentById("l2");
    verify(listingRepository).findIdsForOpenSearchReindex(pg0);
    verify(listingRepository).findIdsForOpenSearchReindex(pg1);
  }
}
