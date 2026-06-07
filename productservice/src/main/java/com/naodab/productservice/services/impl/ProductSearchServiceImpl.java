package com.naodab.productservice.services.impl;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.opensearch.client.opensearch._types.aggregations.Aggregate;
import org.opensearch.client.opensearch._types.aggregations.Aggregation;
import org.opensearch.client.opensearch._types.aggregations.Buckets;
import org.opensearch.client.opensearch._types.aggregations.StringTermsAggregate;
import org.opensearch.client.opensearch._types.aggregations.StringTermsBucket;
import org.opensearch.client.opensearch._types.query_dsl.Query;
import org.opensearch.client.opensearch._types.query_dsl.TextQueryType;
import org.opensearch.data.client.osc.NativeQuery;
import org.opensearch.data.client.osc.OpenSearchAggregation;
import org.opensearch.data.client.osc.OpenSearchAggregations;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.mapping.IndexCoordinates;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.naodab.productservice.documents.ProductDocument;
import com.naodab.productservice.dto.request.ProductSearchRequest;
import com.naodab.productservice.dto.response.PagedItemsResponse;
import com.naodab.productservice.dto.response.PrimarySubcategorySummaryResponse;
import com.naodab.productservice.dto.response.ProductItemResponse;
import com.naodab.productservice.opensearch.OpenSearchNativeQueryHelper;
import com.naodab.productservice.opensearch.OpenSearchSortBy;
import com.naodab.productservice.mapper.ProductMapper;
import com.naodab.productservice.models.Product;
import com.naodab.productservice.repositories.ProductRepository;
import com.naodab.productservice.repositories.SubCategoryRepository;
import com.naodab.productservice.services.ProductSearchService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class ProductSearchServiceImpl implements ProductSearchService {
  static final IndexCoordinates PRODUCT_INDEX = IndexCoordinates.of("products");

  ElasticsearchOperations openSearchOperations;
  ProductMapper productMapper;
  ProductOpenSearchIndexWriter productOpenSearchIndexWriter;
  ProductRepository productRepository;
  SubCategoryRepository subCategoryRepository;

  @NonFinal
  @Value("${default.page-size:20}")
  int defaultPageSize;

  @Override
  public void sync(String productId) {
    try {
      productOpenSearchIndexWriter.writeProductDocumentById(productId);
    } catch (Exception e) {
      log.error("OpenSearch sync failed for product id={}", productId, e);
    }
  }

  @Override
  @Transactional
  public int reindexAllProductsFromDatabase() {
    int batchSize = 50;
    int total = 0;
    Pageable pageable = PageRequest.of(0, batchSize);
    Page<String> idPage;
    do {
      idPage = productRepository.findIdsForOpenSearchReindex(pageable);
      List<String> ids = idPage.getContent();
      if (ids.isEmpty()) {
        break;
      }
      List<Product> products = productRepository.findAllByIdInWithOpenSearchGraph(ids);
      for (Product p : products) {
        saveProductDocument(p);
        total++;
      }
      pageable = idPage.nextPageable();
    } while (idPage.hasNext());
    log.info("OpenSearch products reindex finished: {} documents", total);
    return total;
  }

  private void saveProductDocument(Product product) {
    if (product == null || product.getId() == null) {
      return;
    }

    openSearchOperations.save(productMapper.toProductDocument(product), PRODUCT_INDEX);
  }

  @Override
  public void delete(String productId) {
    if (!StringUtils.hasText(productId)) {
      return;
    }

    openSearchOperations.delete(productId.trim(), PRODUCT_INDEX);
  }

  private record ProductDocumentsPage(List<ProductDocument> documents, long totalCount) {
  }

  private ProductDocumentsPage fetchProductDocumentsPage(ProductSearchRequest request) {
    ProductSearchRequest safeRequest = request == null ? ProductSearchRequest.builder().build() : request;
    int normalizedPage = OpenSearchNativeQueryHelper.normalizePage(safeRequest.getPage());
    int normalizedPageSize = OpenSearchNativeQueryHelper.normalizePageSize(safeRequest.getPageSize(),
        defaultPageSize);
    Pageable pageable = PageRequest.of(normalizedPage, normalizedPageSize);
    NativeQuery query = buildNativeQuery(safeRequest, pageable);

    SearchHits<ProductDocument> hits = openSearchOperations.search(query, ProductDocument.class, PRODUCT_INDEX);
    List<ProductDocument> products = hits.getSearchHits().stream().map(SearchHit::getContent).toList();
    return new ProductDocumentsPage(products, hits.getTotalHits());
  }

  @Override
  public List<ProductDocument> searchProducts(ProductSearchRequest request) {
    return fetchProductDocumentsPage(request).documents();
  }

  @Override
  public List<ProductItemResponse> searchProductItems(ProductSearchRequest request) {
    return fetchProductDocumentsPage(request).documents().stream()
        .map(productMapper::toProductItemResponse)
        .filter(Objects::nonNull)
        .map(this::enrichPrimarySubCategoryName)
        .toList();
  }

  @Override
  public PagedItemsResponse<ProductItemResponse> listOwnedProductItems(ProductSearchRequest request) {
    ProductSearchRequest r = request == null ? ProductSearchRequest.builder().build() : request;
    if (StringUtils.hasText(r.getOwnerId())) {
      r.setOwnerId(r.getOwnerId().trim());
    }
    r.setKeyword(StringUtils.hasText(r.getKeyword()) ? r.getKeyword().trim() : null);
    r.setCategoryIds(emptyToNullNormalize(r.getCategoryIds()));
    r.setSubCategoryIds(emptyToNullNormalize(r.getSubCategoryIds()));
    OpenSearchSortBy sort = normalizeOwnedProductSort(r.getSortBy(), r.getKeyword());
    r.setSortBy(sort);
    ProductDocumentsPage slice = fetchProductDocumentsPage(r);
    int normalizedPage = OpenSearchNativeQueryHelper.normalizePage(r.getPage());
    int normalizedPageSize = OpenSearchNativeQueryHelper.normalizePageSize(r.getPageSize(), defaultPageSize);
    List<ProductItemResponse> items = slice.documents().stream()
        .map(productMapper::toProductItemResponse)
        .filter(Objects::nonNull)
        .map(this::enrichPrimarySubCategoryName)
        .toList();
    return PagedItemsResponse.<ProductItemResponse>builder()
        .items(items)
        .totalCount(slice.totalCount())
        .page(normalizedPage)
        .pageSize(normalizedPageSize)
        .build();
  }

  private static List<String> emptyToNullNormalize(List<String> raw) {
    List<String> n = normalizeIdListPreserveOrder(raw);
    return n.isEmpty() ? null : n;
  }

  private NativeQuery buildNativeQuery(
      ProductSearchRequest request,
      Pageable pageable) {
    return OpenSearchNativeQueryHelper.buildPagedSearchQuery(
        pageable,
        request.getSortBy(),
        false,
        null,
        null,
        must -> OpenSearchNativeQueryHelper.addKeywordMultiMatchMust(
            must,
            request.getKeyword(),
            TextQueryType.PhrasePrefix,
            OpenSearchNativeQueryHelper.productKeywordSearchFields()),
        filter -> {
          OpenSearchNativeQueryHelper.addTermIfTextPresent(filter, "ownerId", request.getOwnerId());
          OpenSearchNativeQueryHelper.addCategoryIdsMatchAllFilterIfPresent(
              filter, request.getCategoryIds());
          OpenSearchNativeQueryHelper.addSubCategoryIdsMatchAllFilterIfPresent(
              filter, request.getSubCategoryIds());
          OpenSearchNativeQueryHelper.addTermIfPresent(filter, "status", request.getStatus());
        });
  }

  @Override
  public List<PrimarySubcategorySummaryResponse> listOwnedPrimarySubcategorySummaries(String ownerId) {
    String oid = ownerId == null ? "" : ownerId.trim();
    if (!StringUtils.hasText(oid)) {
      return List.of();
    }

    List<Query> filters = new ArrayList<>();
    OpenSearchNativeQueryHelper.addTermIfTextPresent(filters, "ownerId", oid);
    Query root = OpenSearchNativeQueryHelper.boolMustFilterQuery(List.of(), filters);

    NativeQuery aggregationQuery = NativeQuery.builder()
        .withMaxResults(0)
        .withQuery(root)
        .withAggregation(
            "psc",
            Aggregation.of(a -> a.terms(t -> t.field("primarySubCategoryId").size(500).minDocCount(1))))
        .build();

    SearchHits<ProductDocument> hits = openSearchOperations.search(aggregationQuery, ProductDocument.class,
        PRODUCT_INDEX);
    if (!hits.hasAggregations()) {
      return List.of();
    }
    OpenSearchAggregations osAggs;
    try {
      osAggs = (OpenSearchAggregations) hits.getAggregations();
    } catch (ClassCastException ex) {
      log.warn("Unexpected aggregations type: {}", hits.getAggregations().getClass().getName());
      return List.of();
    }

    Map<String, Long> counts = extractStringTermCounts(osAggs, "psc");

    List<PrimarySubcategorySummaryResponse> rows = new ArrayList<>();
    for (Map.Entry<String, Long> entry : counts.entrySet()) {
      String sid = entry.getKey();
      long docCount = entry.getValue();
      String label = subCategoryRepository.findById(sid)
          .map(sc -> sc.getName())
          .filter(StringUtils::hasText)
          .orElse(sid);
      rows.add(PrimarySubcategorySummaryResponse.builder()
          .id(sid)
          .name(label.trim())
          .productCount(docCount)
          .build());
    }
    rows.sort(Comparator.comparing(PrimarySubcategorySummaryResponse::getName, String.CASE_INSENSITIVE_ORDER));
    return rows;
  }

  private ProductItemResponse enrichPrimarySubCategoryName(ProductItemResponse item) {
    if (item == null || StringUtils.hasText(item.getPrimarySubCategoryName())) {
      return item;
    }
    String sid = item.getPrimarySubCategoryId();
    if (!StringUtils.hasText(sid)) {
      return item;
    }
    String label = subCategoryRepository.findById(sid.trim())
        .map(sc -> sc.getName())
        .filter(StringUtils::hasText)
        .map(String::trim)
        .orElse(null);
    if (label == null) {
      return item;
    }
    return ProductItemResponse.builder()
        .id(item.getId())
        .name(item.getName())
        .thumbnailImage(item.getThumbnailImage())
        .status(item.getStatus())
        .primarySubCategoryName(label)
        .primarySubCategoryId(item.getPrimarySubCategoryId())
        .variantCount(item.getVariantCount())
        .createdAt(item.getCreatedAt())
        .build();
  }

  private static List<String> normalizeIdListPreserveOrder(List<String> raw) {
    if (raw == null || raw.isEmpty()) {
      return List.of();
    }
    LinkedHashSet<String> seen = new LinkedHashSet<>();
    List<String> out = new ArrayList<>();
    for (String id : raw) {
      if (!StringUtils.hasText(id)) {
        continue;
      }
      String t = id.trim();
      if (seen.add(t)) {
        out.add(t);
      }
    }
    return out;
  }

  private static OpenSearchSortBy normalizeOwnedProductSort(
      OpenSearchSortBy requested, String keyword) {
    OpenSearchSortBy s = requested == null ? OpenSearchSortBy.UPDATED_AT_DESC : requested;
    if (s == OpenSearchSortBy.RELEVANCE && !StringUtils.hasText(keyword)) {
      return OpenSearchSortBy.UPDATED_AT_DESC;
    }
    return s;
  }

  private static Map<String, Long> extractStringTermCounts(OpenSearchAggregations root, String aggName) {
    Map<String, Long> map = new LinkedHashMap<>();
    OpenSearchAggregation wrap = root.get(aggName);
    if (wrap == null) {
      return map;
    }
    Aggregate aggregate = wrap.aggregation().getAggregate();
    if (!aggregate.isSterms()) {
      return map;
    }
    StringTermsAggregate sterms = aggregate.sterms();
    Buckets<StringTermsBucket> buckets = sterms.buckets();
    if (!buckets.isArray()) {
      return map;
    }
    for (StringTermsBucket bucket : buckets.array()) {
      String s = bucket.key();
      if (!StringUtils.hasText(s)) {
        continue;
      }
      map.put(s.trim(), bucket.docCount());
    }
    return map;
  }

}
