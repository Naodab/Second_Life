package com.naodab.productservice.opensearch;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Consumer;

import org.opensearch.client.json.JsonData;
import org.opensearch.client.opensearch._types.DistanceUnit;
import org.opensearch.client.opensearch._types.FieldValue;
import org.opensearch.client.opensearch._types.SortOptions;
import org.opensearch.client.opensearch._types.SortOrder;
import org.opensearch.client.opensearch._types.query_dsl.Operator;
import org.opensearch.client.opensearch._types.query_dsl.Query;
import org.opensearch.client.opensearch._types.query_dsl.TextQueryType;
import org.opensearch.data.client.osc.NativeQuery;
import org.opensearch.data.client.osc.NativeQueryBuilder;
import org.springframework.data.domain.Pageable;
import org.springframework.util.StringUtils;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public final class OpenSearchNativeQueryHelper {

  private static final String DEFAULT_GEO_FIELD = "location";

  private static final Set<String> KNOWN_SCALAR_FILTER_FIELDS = Set.of(
      "ownerId",
      "facilityId",
      "provinceCode",
      "wardCode",
      "productId",
      "status",
      "listingType",
      "listingStatus");

  private OpenSearchNativeQueryHelper() {
  }

  public static Set<String> keywordScalarFilterFieldNames() {
    return KNOWN_SCALAR_FILTER_FIELDS;
  }

  public static String exactTermOpenSearchField(String baseFilterFieldName) {
    return baseFilterFieldName;
  }

  public static Query exactTermQuery(String baseFilterFieldName, String value) {
    FieldValue fv = FieldValue.of(value);
    String path = exactTermOpenSearchField(baseFilterFieldName);
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

  public static void addKeywordSearchMust(List<Query> mustQueries, String keyword, String... searchFields) {
    if (!StringUtils.hasText(keyword) || searchFields == null || searchFields.length == 0) {
      return;
    }
    String trimmed = keyword.trim();
    List<String> fields = Arrays.asList(searchFields);
    if (trimmed.indexOf(' ') >= 0) {
      mustQueries.add(Query.of(root -> root.bool(b -> {
        b.must(Query.of(q -> q.multiMatch(mm -> mm
            .query(trimmed)
            .type(TextQueryType.CrossFields)
            .operator(Operator.And)
            .fields(fields))));
        b.should(Query.of(q -> q.multiMatch(mm -> mm
            .query(trimmed)
            .type(TextQueryType.Phrase)
            .fields(fields)
            .boost(2.0f))));
        return b;
      })));
      return;
    }
    addKeywordMultiMatchMust(mustQueries, trimmed, TextQueryType.BestFields, searchFields);
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
    String esField = exactTermOpenSearchField(arrayFieldName);
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

  public static void addTermsIfPresent(List<Query> filterQueries, String fieldName, List<? extends Enum<?>> values) {
    if (values == null || values.isEmpty()) {
      return;
    }
    LinkedHashSet<String> distinct = new LinkedHashSet<>();
    for (Enum<?> value : values) {
      if (value != null) {
        distinct.add(value.name());
      }
    }
    if (distinct.isEmpty()) {
      return;
    }
    if (distinct.size() == 1) {
      filterQueries.add(exactTermQuery(fieldName, distinct.iterator().next()));
      return;
    }
    String path = exactTermOpenSearchField(fieldName);
    List<FieldValue> fieldValues = distinct.stream().map(FieldValue::of).toList();
    filterQueries.add(Query.of(q -> q.terms(t -> t.field(path).terms(tv -> tv.value(fieldValues)))));
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
            .field("maxPrice")
            .gte(JsonData.of(filterMin)))));
      }
      if (filterMax != null) {
        bool.must(Query.of(inner -> inner.range(range -> range
            .field("minPrice")
            .lte(JsonData.of(filterMax)))));
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
      OpenSearchSortBy sortByInput,
      boolean geoRadiusFilterEnabled,
      Float latitude,
      Float longitude) {
    return queryBuilder -> appendStandardSort(
        queryBuilder,
        sortByInput == null ? OpenSearchSortBy.RELEVANCE : sortByInput,
        geoRadiusFilterEnabled,
        latitude == null ? 0f : latitude,
        longitude == null ? 0f : longitude);
  }

  public static void appendStandardSort(
      NativeQueryBuilder queryBuilder,
      OpenSearchSortBy sortBy,
      boolean geoRadiusFilterEnabled,
      float latitude,
      float longitude) {
    if (sortBy == OpenSearchSortBy.DISTANCE && geoRadiusFilterEnabled) {
      queryBuilder.withSort(distanceSort(DEFAULT_GEO_FIELD, latitude, longitude));
      return;
    }

    if (sortBy == OpenSearchSortBy.RELEVANCE) {
      queryBuilder.withSort(SortOptions.of(s -> s.score(sc -> sc.order(SortOrder.Desc))));
      queryBuilder.withSort(fieldSort("updatedAt", SortOrder.Desc));
      return;
    }

    if (sortBy == OpenSearchSortBy.UPDATED_AT_DESC) {
      queryBuilder.withSort(fieldSort("updatedAt", SortOrder.Desc));
      return;
    }

    if (sortBy == OpenSearchSortBy.CREATED_AT_DESC) {
      queryBuilder.withSort(fieldSort("createdAt", SortOrder.Desc));
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
    return new String[] {
        "name^3",
        "description",
        "primarySubCategoryName^2",
        "attributeValues",
        "variantSkus",
    };
  }

  public static String[] listingKeywordSearchFields() {
    return new String[] {
        "title^3",
        "name^3",
        "listingDescription",
        "description",
        "primarySubCategoryName^2",
        "attributeValues",
        "variantSkus",
    };
  }

  public static NativeQuery buildPagedSearchQuery(
      Pageable pageable,
      OpenSearchSortBy sortBy,
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
