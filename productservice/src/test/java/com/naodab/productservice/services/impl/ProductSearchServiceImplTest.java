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
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.mapping.IndexCoordinates;
import org.springframework.data.elasticsearch.core.query.Query;
import org.springframework.test.util.ReflectionTestUtils;

import com.naodab.productservice.documents.ProductDocument;
import com.naodab.productservice.dto.request.ProductSearchRequest;
import com.naodab.productservice.dto.response.ProductItemResponse;
import com.naodab.productservice.opensearch.OpenSearchSortBy;
import com.naodab.productservice.mapper.ProductMapper;
import com.naodab.productservice.models.Product;
import com.naodab.productservice.repositories.ProductRepository;
import com.naodab.productservice.repositories.SubCategoryRepository;

@ExtendWith(MockitoExtension.class)
class ProductSearchServiceImplTest {

  static final int BATCH = 50;

  @Mock
  ElasticsearchOperations openSearchOperations;

  @Mock
  ProductMapper productMapper;

  @Mock
  ProductOpenSearchIndexWriter productOpenSearchIndexWriter;

  @Mock
  ProductRepository productRepository;

  @Mock
  SubCategoryRepository subCategoryRepository;

  @InjectMocks
  ProductSearchServiceImpl productSearchService;

  @BeforeEach
  void injectPageSize() {
    ReflectionTestUtils.setField(productSearchService, "defaultPageSize", 20);
  }

  @Test
  void delete_blankId_doesNotCallOpenSearch() {
    productSearchService.delete(null);
    productSearchService.delete("   ");
    verify(openSearchOperations, never()).delete(any(), any(IndexCoordinates.class));
  }

  @Test
  void delete_trimsIdAndDeletes() {
    productSearchService.delete("  pid  ");
    verify(openSearchOperations).delete(eq("pid"), eq(IndexCoordinates.of("products")));
  }

  @Test
  void sync_swallowsWriterExceptions() {
    doThrow(new RuntimeException("boom")).when(productOpenSearchIndexWriter).writeProductDocumentById("x");
    assertThatCode(() -> productSearchService.sync("x")).doesNotThrowAnyException();
  }

  @Test
  void listOwnedPrimarySubcategorySummaries_blankOwner_returnsEmpty() {
    assertThat(productSearchService.listOwnedPrimarySubcategorySummaries(null)).isEmpty();
    assertThat(productSearchService.listOwnedPrimarySubcategorySummaries("  ")).isEmpty();
    verify(openSearchOperations, never()).search(any(Query.class),
        ArgumentMatchers.<Class<ProductDocument>>any(), any());
  }

  @Test
  void searchProductItems_returnsMappedHits() {
    ProductDocument doc = ProductDocument.builder().id("p1").name("n").build();
    ProductItemResponse item = ProductItemResponse.builder().id("p1").name("n").build();
    stubSearchHits(List.of(doc), 1L);
    when(productMapper.toProductItemResponse(doc)).thenReturn(item);

    List<ProductItemResponse> out =
        productSearchService.searchProductItems(ProductSearchRequest.builder().build());

    assertThat(out).containsExactly(item);
    verify(openSearchOperations).search(any(Query.class), eq(ProductDocument.class),
        eq(IndexCoordinates.of("products")));
  }

  @Test
  void listOwnedProductItems_fallbacksSortWhenRelevanceWithoutKeyword_mutatesRequest() {
    ProductDocument doc = ProductDocument.builder().id("p1").build();
    ProductItemResponse item = ProductItemResponse.builder().id("p1").name("product").build();
    stubSearchHits(List.of(doc), 10L);
    when(productMapper.toProductItemResponse(doc)).thenReturn(item);

    ProductSearchRequest req =
        ProductSearchRequest.builder().ownerId("  own ").keyword(null).sortBy(OpenSearchSortBy.RELEVANCE)
            .page(3).pageSize(5).build();

    productSearchService.listOwnedProductItems(req);

    assertThat(req.getSortBy()).isEqualTo(OpenSearchSortBy.UPDATED_AT_DESC);
    assertThat(req.getOwnerId()).isEqualTo("own");
  }

  @Test
  void reindexAllProductsFromDatabase_savesEachMappedDocument() {
    Product p1 = mock(Product.class);
    when(p1.getId()).thenReturn("id1");
    Product p2 = mock(Product.class);
    when(p2.getId()).thenReturn("id2");

    PageRequest firstPage = PageRequest.of(0, BATCH);
    when(productRepository.findIdsForOpenSearchReindex(firstPage)).thenReturn(
        new PageImpl<>(List.of("id1", "id2"), firstPage, 2));
    when(productRepository.findAllByIdInWithOpenSearchGraph(List.of("id1", "id2"))).thenReturn(List.of(p1, p2));

    ProductDocument d1 = ProductDocument.builder().id("id1").build();
    ProductDocument d2 = ProductDocument.builder().id("id2").build();
    when(productMapper.toProductDocument(p1)).thenReturn(d1);
    when(productMapper.toProductDocument(p2)).thenReturn(d2);

    int written = productSearchService.reindexAllProductsFromDatabase();

    assertThat(written).isEqualTo(2);
    verify(openSearchOperations).save(d1, IndexCoordinates.of("products"));
    verify(openSearchOperations).save(d2, IndexCoordinates.of("products"));
    verify(productRepository).findIdsForOpenSearchReindex(firstPage);
  }

  @SuppressWarnings("unchecked")
  private void stubSearchHits(List<ProductDocument> docs, long total) {
    List<SearchHit<ProductDocument>> searchHits = docs.stream().map(doc -> {
      SearchHit<ProductDocument> sh = mock(SearchHit.class);
      when(sh.getContent()).thenReturn(doc);
      return sh;
    }).toList();

    SearchHits<ProductDocument> hits = mock(SearchHits.class);
    when(hits.getSearchHits()).thenReturn(searchHits);
    when(hits.getTotalHits()).thenReturn(total);

    when(openSearchOperations.search(any(Query.class), eq(ProductDocument.class),
        eq(IndexCoordinates.of("products")))).thenReturn(hits);
  }
}
