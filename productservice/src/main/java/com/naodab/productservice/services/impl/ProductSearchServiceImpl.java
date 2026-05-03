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
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchAggregation;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchAggregations;
import org.springframework.data.elasticsearch.core.mapping.IndexCoordinates;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import co.elastic.clients.elasticsearch._types.FieldValue;
import co.elastic.clients.elasticsearch._types.aggregations.Aggregate;
import co.elastic.clients.elasticsearch._types.aggregations.Aggregation;
import co.elastic.clients.elasticsearch._types.aggregations.Buckets;
import co.elastic.clients.elasticsearch._types.aggregations.StringTermsAggregate;
import co.elastic.clients.elasticsearch._types.aggregations.StringTermsBucket;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch._types.query_dsl.TextQueryType;

import com.naodab.productservice.documents.ProductDocument;
import com.naodab.productservice.dto.request.ProductSearchRequest;
import com.naodab.productservice.dto.response.PagedItemsResponse;
import com.naodab.productservice.dto.response.PrimarySubcategorySummaryResponse;
import com.naodab.productservice.dto.response.ProductItemResponse;
import com.naodab.productservice.elasticsearch.ElasticsearchNativeQueryHelper;
import com.naodab.productservice.elasticsearch.ElasticsearchSortBy;
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

  ElasticsearchOperations elasticsearchOperations;
  ProductMapper productMapper;
  ProductElasticsearchIndexWriter productElasticsearchIndexWriter;
  ProductRepository productRepository;
  SubCategoryRepository subCategoryRepository;

  @NonFinal
  @Value("${default.page-size:20}")
  int defaultPageSize;

  /**
   * Synchronous index refresh so seller facility lists (loaded from Elasticsearch) reflect
   * create/update/publish immediately instead of lagging behind async completion.
   */
  @Override
  public void sync(String productId) {
    try {
      productElasticsearchIndexWriter.writeProductDocumentById(productId);
    } catch (Exception e) {
      log.error("Elasticsearch sync failed for product id={}", productId, e);
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
      idPage = productRepository.findIdsForElasticsearchReindex(pageable);
      List<String> ids = idPage.getContent();
      if (ids.isEmpty()) {
        break;
      }
      List<Product> products = productRepository.findAllByIdInWithElasticsearchGraph(ids);
      for (Product p : products) {
        saveProductDocument(p);
        total++;
      }
      pageable = idPage.nextPageable();
    } while (idPage.hasNext());
    log.info("Elasticsearch products reindex finished: {} documents", total);
    return total;
  }

  private void saveProductDocument(Product product) {
    if (product == null || product.getId() == null) {
      return;
    }

    elasticsearchOperations.save(productMapper.toProductDocument(product), PRODUCT_INDEX);
  }

  @Override
  public void delete(String productId) {
    if (!StringUtils.hasText(productId)) {
      return;
    }

    elasticsearchOperations.delete(productId.trim(), PRODUCT_INDEX);
  }

  private record ProductDocumentsPage(List<ProductDocument> documents, long totalCount) {
  }

  private ProductDocumentsPage fetchProductDocumentsPage(ProductSearchRequest request) {
    ProductSearchRequest safeRequest = request == null ? ProductSearchRequest.builder().build() : request;
    int normalizedPage = ElasticsearchNativeQueryHelper.normalizePage(safeRequest.getPage());
    int normalizedPageSize = ElasticsearchNativeQueryHelper.normalizePageSize(safeRequest.getPageSize(),
        defaultPageSize);
    boolean geoRadiusFilterEnabled = ElasticsearchNativeQueryHelper.hasGeoRadiusFilter(safeRequest.getLatitude(),
        safeRequest.getLongitude(),
        safeRequest.getRadiusMeters());
    Pageable pageable = PageRequest.of(normalizedPage, normalizedPageSize);
    NativeQuery query = buildNativeQuery(safeRequest, pageable, geoRadiusFilterEnabled);

    SearchHits<ProductDocument> hits = elasticsearchOperations.search(query, ProductDocument.class, PRODUCT_INDEX);
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
        .toList();
  }

  @Override
  public PagedItemsResponse<ProductItemResponse> listProductItemsForFacility(ProductSearchRequest request) {
    ProductSearchRequest r = request == null ? ProductSearchRequest.builder().build() : request;
    if (StringUtils.hasText(r.getFacilityId())) {
      r.setFacilityId(r.getFacilityId().trim());
    }
    r.setKeyword(StringUtils.hasText(r.getKeyword()) ? r.getKeyword().trim() : null);
    r.setCategoryIds(emptyToNullNormalize(r.getCategoryIds()));
    r.setSubCategoryIds(emptyToNullNormalize(r.getSubCategoryIds()));
    ElasticsearchSortBy sort = normalizeFacilityProductSort(r.getSortBy(), r.getKeyword());
    r.setSortBy(sort);
    ProductDocumentsPage slice = fetchProductDocumentsPage(r);
    int normalizedPage = ElasticsearchNativeQueryHelper.normalizePage(r.getPage());
    int normalizedPageSize = ElasticsearchNativeQueryHelper.normalizePageSize(r.getPageSize(), defaultPageSize);
    List<ProductItemResponse> items = slice.documents().stream()
        .map(productMapper::toProductItemResponse)
        .filter(Objects::nonNull)
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
      Pageable pageable,
      boolean geoRadiusFilterEnabled) {
    float lat = geoRadiusFilterEnabled ? request.getLatitude() : 0f;
    float lon = geoRadiusFilterEnabled ? request.getLongitude() : 0f;
    float radiusMeters = geoRadiusFilterEnabled ? request.getRadiusMeters() : 0f;

    return ElasticsearchNativeQueryHelper.buildPagedSearchQuery(
        pageable,
        request.getSortBy(),
        geoRadiusFilterEnabled,
        request.getLatitude(),
        request.getLongitude(),
        must -> ElasticsearchNativeQueryHelper.addKeywordMultiMatchMust(
            must,
            request.getKeyword(),
            TextQueryType.PhrasePrefix,
            ElasticsearchNativeQueryHelper.productKeywordSearchFields()),
        filter -> {
          ElasticsearchNativeQueryHelper.addStandardLocationFilters(
              filter, request.getFacilityId(), request.getProvinceCode(), request.getWardCode());
          ElasticsearchNativeQueryHelper.addCategoryIdsMatchAllFilterIfPresent(
              filter, request.getCategoryIds());
          ElasticsearchNativeQueryHelper.addSubCategoryIdsMatchAllFilterIfPresent(
              filter, request.getSubCategoryIds());
          ElasticsearchNativeQueryHelper.addTermIfPresent(filter, "status", request.getStatus());
          ElasticsearchNativeQueryHelper.addGeoDistanceFilterIfEnabled(
              filter, geoRadiusFilterEnabled, lat, lon, radiusMeters);
        });
  }

  @Override
  public List<PrimarySubcategorySummaryResponse> listPrimarySubcategorySummariesForFacility(String facilityId) {
    String fid = facilityId == null ? "" : facilityId.trim();
    if (!StringUtils.hasText(fid)) {
      return List.of();
    }

    List<Query> filters = new ArrayList<>();
    ElasticsearchNativeQueryHelper.addStandardLocationFilters(filters, fid, null, null);
    Query root = ElasticsearchNativeQueryHelper.boolMustFilterQuery(List.of(), filters);

    NativeQuery aggregationQuery = NativeQuery.builder()
        .withMaxResults(0)
        .withQuery(root)
        .withAggregation(
            "psc_base",
            Aggregation.of(a -> a.terms(t -> t.field("primarySubCategoryId").size(500).minDocCount(1))))
        .withAggregation(
            "psc_kw",
            Aggregation.of(a -> a.terms(t -> t.field("primarySubCategoryId.keyword").size(500).minDocCount(1))))
        .build();

    SearchHits<ProductDocument> hits = elasticsearchOperations.search(aggregationQuery, ProductDocument.class,
        PRODUCT_INDEX);
    if (!hits.hasAggregations()) {
      return List.of();
    }
    ElasticsearchAggregations esAggs;
    try {
      esAggs = (ElasticsearchAggregations) hits.getAggregations();
    } catch (ClassCastException ex) {
      log.warn("Unexpected aggregations type: {}", hits.getAggregations().getClass().getName());
      return List.of();
    }

    Map<String, Long> base = extractStringTermCounts(esAggs, "psc_base");
    Map<String, Long> kw = extractStringTermCounts(esAggs, "psc_kw");
    Map<String, Long> counts = !base.isEmpty() ? base : kw;

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

  private static ElasticsearchSortBy normalizeFacilityProductSort(
      ElasticsearchSortBy requested, String keyword) {
    ElasticsearchSortBy s = requested == null ? ElasticsearchSortBy.UPDATED_AT_DESC : requested;
    if (s == ElasticsearchSortBy.RELEVANCE && !StringUtils.hasText(keyword)) {
      return ElasticsearchSortBy.UPDATED_AT_DESC;
    }
    return s;
  }

  private static Map<String, Long> extractStringTermCounts(ElasticsearchAggregations root, String aggName) {
    Map<String, Long> map = new LinkedHashMap<>();
    ElasticsearchAggregation wrap = root.get(aggName);
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
      FieldValue key = bucket.key();
      if (!key.isString()) {
        continue;
      }
      String s = key.stringValue();
      if (!StringUtils.hasText(s)) {
        continue;
      }
      map.put(s.trim(), bucket.docCount());
    }
    return map;
  }

}
