package com.naodab.productservice.elasticsearch;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Consumer;

import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.client.elc.NativeQueryBuilder;
import org.springframework.util.StringUtils;

import co.elastic.clients.elasticsearch._types.FieldValue;
import co.elastic.clients.elasticsearch._types.DistanceUnit;
import co.elastic.clients.elasticsearch._types.SortOrder;
import co.elastic.clients.elasticsearch._types.SortOptions;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch._types.query_dsl.TextQueryType;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public final class ElasticsearchNativeQueryHelper {

  private static final String DEFAULT_GEO_FIELD = "location";

  private static final Set<String> EXACT_TERM_ID_FIELDS_DOT_KEYWORD = Set.of(
      "facilityId",
      "productId",
      "categoryIds",
      "categoryId",
      "subCategoryIds",
      "subCategoryId");

  private static final Set<String> KNOWN_SCALAR_FILTER_FIELDS = Set.of(
      "facilityId",
      "provinceCode",
      "wardCode",
      "productId",
      "status",
      "listingType",
      "listingStatus");

  private ElasticsearchNativeQueryHelper() {
  }

  public static Set<String> keywordScalarFilterFieldNames() {
    return KNOWN_SCALAR_FILTER_FIELDS;
  }

  public static String exactTermElasticsearchField(String baseFilterFieldName) {
    String base = baseFilterFieldName;
    if (base != null && EXACT_TERM_ID_FIELDS_DOT_KEYWORD.contains(base)) {
      return base + ".keyword";
    }
    return base;
  }

  public static Query exactTermQuery(String baseFilterFieldName, String value) {
    FieldValue fv = FieldValue.of(value);
    String path = exactTermElasticsearchField(baseFilterFieldName);
    return Query.of(q -> q.term(t -> t.field(path).value(fv)));
  }

  public static int normalizePage(Integer page) {
    return page == null || page < 0 ? 0 : page;
  }

  public static int normalizePageSize(Integer pageSize, int defaultPageSize) {
    return pageSize == null || pageSize <= 0 ? defaultPageSize : pageSize;
  }

  public static boolean hasGeoRadiusFilter(Float latitude, Float longitude, Float radiusMeters) {
    return latitude != null
        && longitude != null
        && radiusMeters != null
        && radiusMeters > 0;
  }

  public static void addKeywordMultiMatchMust(List<Query> mustQueries, String keyword, String... searchFields) {
    addKeywordMultiMatchMust(mustQueries, keyword, TextQueryType.BestFields, searchFields);
  }

  public static void addKeywordMultiMatchMust(
      List<Query> mustQueries, String keyword, TextQueryType type, String... searchFields) {
    if (!StringUtils.hasText(keyword) || searchFields == null || searchFields.length == 0) {
      return;
    }
    String trimmed = keyword.trim();
    mustQueries.add(Query.of(query -> query
        .multiMatch(multiMatch -> multiMatch
            .query(trimmed)
            .type(type)
            .fields(Arrays.asList(searchFields)))));
  }

  public static void addTermIfTextPresent(List<Query> filterQueries, String fieldName, String value) {
    if (!StringUtils.hasText(value)) {
      return;
    }
    filterQueries.add(exactTermQuery(fieldName, value.trim()));
  }

  public static void addKeywordArrayFieldContainsAllIfPresent(
      List<Query> filterQueries,
      String arrayFieldName,
      List<String> rawIds) {
    if (rawIds == null || rawIds.isEmpty() || !StringUtils.hasText(arrayFieldName)) {
      return;
    }
    LinkedHashSet<String> distinct = new LinkedHashSet<>();
    for (String id : rawIds) {
      if (StringUtils.hasText(id)) {
        distinct.add(id.trim());
      }
    }
    if (distinct.isEmpty()) {
      return;
    }
    String esField = exactTermElasticsearchField(arrayFieldName);
    if (distinct.size() == 1) {
      String single = distinct.iterator().next();
      filterQueries.add(
          Query.of(q -> q.term(t -> t.field(esField).value(FieldValue.of(single)))));
      return;
    }
    filterQueries.add(Query.of(root -> root.bool(b -> {
      for (String sid : distinct) {
        b.must(Query.of(inner -> inner.term(t -> t.field(esField).value(FieldValue.of(sid)))));
      }
      return b;
    })));
  }

  public static void addSubCategoryIdsMatchAllFilterIfPresent(List<Query> filterQueries, List<String> rawIds) {
    addKeywordArrayFieldContainsAllIfPresent(filterQueries, "subCategoryIds", rawIds);
  }

  public static void addCategoryIdsMatchAllFilterIfPresent(List<Query> filterQueries, List<String> rawIds) {
    addKeywordArrayFieldContainsAllIfPresent(filterQueries, "categoryIds", rawIds);
  }

  public static void addTermIfPresent(List<Query> filterQueries, String fieldName, Enum<?> value) {
    if (value == null) {
      return;
    }
    filterQueries.add(exactTermQuery(fieldName, value.name()));
  }

  public static Query termQuery(String fieldName, String value) {
    return Query.of(query -> query.term(term -> term.field(fieldName).value(FieldValue.of(value))));
  }

  public static void addGeoDistanceFilterIfEnabled(
      List<Query> filterQueries,
      boolean geoRadiusFilterEnabled,
      float latitude,
      float longitude,
      float radiusMeters) {
    if (!geoRadiusFilterEnabled) {
      return;
    }
    filterQueries.add(geoDistanceQuery(DEFAULT_GEO_FIELD, latitude, longitude, radiusMeters));
  }

  public static Query geoDistanceQuery(String fieldName, float latitude, float longitude, float radiusMeters) {
    return Query.of(query -> query.geoDistance(geoDistance -> geoDistance
        .field(fieldName)
        .distance(radiusMeters + "m")
        .location(location -> location.latlon(latlon -> latlon
            .lat(latitude)
            .lon(longitude)))));
  }

  public static void addStandardLocationFilters(
      List<Query> filterQueries,
      String facilityId,
      String provinceCode,
      String wardCode) {
    addTermIfTextPresent(filterQueries, "facilityId", facilityId);
    addTermIfTextPresent(filterQueries, "provinceCode", provinceCode);
    addTermIfTextPresent(filterQueries, "wardCode", wardCode);
  }

  public static Query overlapPriceRangeQuery(Double filterMin, Double filterMax) {
    return Query.of(root -> root.bool(bool -> {
      if (filterMin != null) {
        bool.must(Query.of(inner -> inner.range(range -> range
            .number(n -> n.field("maxPrice").gte(filterMin)))));
      }
      if (filterMax != null) {
        bool.must(Query.of(inner -> inner.range(range -> range
            .number(n -> n.field("minPrice").lte(filterMax)))));
      }
      return bool;
    }));
  }

  public static Query boolMustFilterQuery(List<Query> mustQueries, List<Query> filterQueries) {
    List<Query> must = mustQueries == null ? List.of() : mustQueries;
    List<Query> filter = filterQueries == null ? List.of() : filterQueries;
    return Query.of(root -> root.bool(bool -> {
      if (!must.isEmpty()) {
        bool.must(must);
      }
      if (!filter.isEmpty()) {
        bool.filter(filter);
      }
      return bool;
    }));
  }

  public static NativeQuery nativeQuery(Pageable pageable, Query rootQuery, Consumer<NativeQueryBuilder> appendSort) {
    NativeQueryBuilder builder = NativeQuery.builder()
        .withQuery(rootQuery)
        .withPageable(pageable);
    appendSort.accept(builder);
    var query = builder.build();
    log.info("Native query: {}", query.getQuery());
    return query;
  }

  public static Consumer<NativeQueryBuilder> standardSortAppender(
      ElasticsearchSortBy sortByInput,
      boolean geoRadiusFilterEnabled,
      Float latitude,
      Float longitude) {
    return queryBuilder -> appendStandardSort(
        queryBuilder,
        sortByInput == null ? ElasticsearchSortBy.RELEVANCE : sortByInput,
        geoRadiusFilterEnabled,
        latitude == null ? 0f : latitude,
        longitude == null ? 0f : longitude);
  }

  public static void appendStandardSort(
      NativeQueryBuilder queryBuilder,
      ElasticsearchSortBy sortBy,
      boolean geoRadiusFilterEnabled,
      float latitude,
      float longitude) {
    if (sortBy == ElasticsearchSortBy.DISTANCE && geoRadiusFilterEnabled) {
      queryBuilder.withSort(distanceSort(DEFAULT_GEO_FIELD, latitude, longitude));
      return;
    }

    if (sortBy == ElasticsearchSortBy.RELEVANCE) {
      queryBuilder.withSort(SortOptions.of(s -> s.score(sc -> sc.order(SortOrder.Desc))));
      queryBuilder.withSort(fieldSort("updatedAt", SortOrder.Desc));
      return;
    }

    if (sortBy == ElasticsearchSortBy.UPDATED_AT_DESC) {
      queryBuilder.withSort(fieldSort("updatedAt", SortOrder.Desc));
      return;
    }

    if (sortBy == ElasticsearchSortBy.CREATED_AT_DESC) {
      queryBuilder.withSort(fieldSort("createdAt", SortOrder.Desc));
      return;
    }

    if (sortBy == ElasticsearchSortBy.NAME_ASC) {
      queryBuilder.withSort(fieldSort("name.keyword", SortOrder.Asc));
    }
  }

  private static SortOptions fieldSort(String fieldName, SortOrder sortOrder) {
    return SortOptions.of(sort -> sort.field(field -> field.field(fieldName).order(sortOrder)));
  }

  private static SortOptions distanceSort(String fieldName, float latitude, float longitude) {
    return SortOptions.of(sort -> sort.geoDistance(geoDistance -> geoDistance
        .field(fieldName)
        .location(location -> location.latlon(latlon -> latlon
            .lat(latitude)
            .lon(longitude)))
        .order(SortOrder.Asc)
        .unit(DistanceUnit.Meters)));
  }

  public static String[] productKeywordSearchFields() {
    return new String[] { "name^3", "description", "attributeValues", "variantSkus" };
  }

  public static String[] listingKeywordSearchFields() {
    return new String[] {
        "title",
        "listingDescription",
        "name",
        "description",
        "attributeValues",
        "variantSkus",
    };
  }

  public static NativeQuery buildPagedSearchQuery(
      Pageable pageable,
      ElasticsearchSortBy sortBy,
      boolean geoRadiusFilterEnabled,
      Float latitude,
      Float longitude,
      Consumer<List<Query>> appendMustQueries,
      Consumer<List<Query>> appendFilterQueries) {
    List<Query> mustQueries = new ArrayList<>();
    List<Query> filterQueries = new ArrayList<>();
    appendMustQueries.accept(mustQueries);
    appendFilterQueries.accept(filterQueries);
    Query boolQuery = boolMustFilterQuery(mustQueries, filterQueries);
    return nativeQuery(pageable, boolQuery, standardSortAppender(
        sortBy, geoRadiusFilterEnabled, latitude, longitude));
  }

}
