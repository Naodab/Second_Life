package com.naodab.productservice.services.impl;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.client.elc.NativeQueryBuilder;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.mapping.IndexCoordinates;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.naodab.productservice.dto.request.ProductSearchRequest;
import com.naodab.productservice.dto.request.ProductSearchRequest.ProductSortBy;
import com.naodab.productservice.documents.ProductDocument;
import com.naodab.productservice.mapper.ProductMapper;
import com.naodab.productservice.models.Product;
import com.naodab.productservice.services.ProductSearchService;

import co.elastic.clients.elasticsearch._types.DistanceUnit;
import co.elastic.clients.elasticsearch._types.SortOrder;
import co.elastic.clients.elasticsearch._types.SortOptions;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class ProductSearchServiceImpl implements ProductSearchService {
  static final IndexCoordinates PRODUCT_INDEX = IndexCoordinates.of("products");

  ElasticsearchOperations elasticsearchOperations;
  ProductMapper productMapper;

  @NonFinal
  @Value("${default.page-size:20}")
  int defaultPageSize;

  @Override
  @Async
  public void sync(Product product) {
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

  @Override
  public List<ProductDocument> searchProducts(ProductSearchRequest request) {
    ProductSearchRequest safeRequest = request == null ? ProductSearchRequest.builder().build() : request;
    int normalizedPage = normalizePage(safeRequest.getPage());
    int normalizedPageSize = normalizePageSize(safeRequest.getPageSize());
    boolean geoRadiusFilterEnabled = hasGeoRadiusFilter(safeRequest);
    Pageable pageable = PageRequest.of(normalizedPage, normalizedPageSize);
    NativeQuery query = buildNativeQuery(safeRequest, pageable, geoRadiusFilterEnabled);

    SearchHits<ProductDocument> hits = elasticsearchOperations.search(query, ProductDocument.class, PRODUCT_INDEX);
    List<ProductDocument> products = new ArrayList<>();
    for (SearchHit<ProductDocument> hit : hits) {
      products.add(hit.getContent());
    }
    return products;
  }

  private int normalizePage(Integer page) {
    return page == null || page < 0 ? 0 : page;
  }

  private int normalizePageSize(Integer pageSize) {
    return pageSize == null || pageSize <= 0 ? defaultPageSize : pageSize;
  }

  private boolean hasGeoRadiusFilter(ProductSearchRequest request) {
    return request.getLatitude() != null
        && request.getLongitude() != null
        && request.getRadiusMeters() != null
        && request.getRadiusMeters() > 0;
  }

  private NativeQuery buildNativeQuery(ProductSearchRequest request, Pageable pageable, boolean geoRadiusFilterEnabled) {
    List<Query> mustQueries = new ArrayList<>();
    List<Query> filterQueries = new ArrayList<>();

    if (StringUtils.hasText(request.getKeyword())) {
      mustQueries.add(Query.of(query -> query
          .multiMatch(multiMatch -> multiMatch
              .query(request.getKeyword().trim())
              .fields("name", "description", "attributeValues", "variantSkus"))));
    }

    if (StringUtils.hasText(request.getFacilityId())) {
      filterQueries.add(termQuery("facilityId", request.getFacilityId().trim()));
    }

    if (StringUtils.hasText(request.getProvinceCode())) {
      filterQueries.add(termQuery("provinceCode", request.getProvinceCode().trim()));
    }

    if (StringUtils.hasText(request.getWardCode())) {
      filterQueries.add(termQuery("wardCode", request.getWardCode().trim()));
    }

    if (request.getStatus() != null) {
      filterQueries.add(termQuery("status", request.getStatus().name()));
    }

    if (geoRadiusFilterEnabled) {
      filterQueries.add(Query.of(query -> query.geoDistance(geoDistance -> geoDistance
          .field("location")
          .distance(request.getRadiusMeters() + "m")
          .location(location -> location.latlon(latlon -> latlon
              .lat(request.getLatitude())
              .lon(request.getLongitude()))))));
    }

    Query query = Query.of(root -> root.bool(bool -> {
      if (!mustQueries.isEmpty()) {
        bool.must(mustQueries);
      }
      if (!filterQueries.isEmpty()) {
        bool.filter(filterQueries);
      }
      return bool;
    }));

    NativeQueryBuilder queryBuilder = NativeQuery.builder()
        .withQuery(query)
        .withPageable(pageable);

    appendSort(queryBuilder, request, geoRadiusFilterEnabled);

    return queryBuilder.build();
  }

  private Query termQuery(String fieldName, String value) {
    return Query.of(query -> query.term(term -> term.field(fieldName).value(value)));
  }

  private void appendSort(
      NativeQueryBuilder queryBuilder,
      ProductSearchRequest request,
      boolean geoRadiusFilterEnabled) {
    ProductSortBy sortBy = request.getSortBy() == null ? ProductSortBy.RELEVANCE : request.getSortBy();

    if (sortBy == ProductSortBy.DISTANCE && geoRadiusFilterEnabled) {
      queryBuilder.withSort(distanceSort(request.getLatitude(), request.getLongitude()));
      return;
    }

    if (sortBy == ProductSortBy.UPDATED_AT_DESC) {
      queryBuilder.withSort(fieldSort("updatedAt", SortOrder.Desc));
      return;
    }

    if (sortBy == ProductSortBy.CREATED_AT_DESC) {
      queryBuilder.withSort(fieldSort("createdAt", SortOrder.Desc));
    }
  }

  private SortOptions fieldSort(String fieldName, SortOrder sortOrder) {
    return SortOptions.of(sort -> sort.field(field -> field.field(fieldName).order(sortOrder)));
  }

  private SortOptions distanceSort(float latitude, float longitude) {
    return SortOptions.of(sort -> sort.geoDistance(geoDistance -> geoDistance
        .field("location")
        .location(location -> location.latlon(latlon -> latlon
            .lat(latitude)
            .lon(longitude)))
        .order(SortOrder.Asc)
        .unit(DistanceUnit.Meters)));
  }
}
