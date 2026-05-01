package com.naodab.productservice.services.impl;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.mapping.IndexCoordinates;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.naodab.productservice.documents.ListingDocument;
import com.naodab.productservice.dto.request.ListingSearchRequest;
import com.naodab.productservice.elasticsearch.ElasticsearchNativeQueryHelper;
import com.naodab.productservice.mapper.ListingMapper;
import com.naodab.productservice.models.Listing;
import com.naodab.productservice.services.ListingSearchService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class ListingSearchServiceImpl implements ListingSearchService {
  static final IndexCoordinates LISTING_INDEX = IndexCoordinates.of("listings");

  ElasticsearchOperations elasticsearchOperations;
  ListingMapper listingMapper;

  @NonFinal
  @Value("${default.page-size:20}")
  int defaultPageSize;

  @Override
  @Async
  public void sync(Listing listing) {
    if (listing == null || listing.getId() == null) {
      return;
    }

    elasticsearchOperations.save(listingMapper.toListingDocument(listing), LISTING_INDEX);
  }

  @Override
  public void delete(String listingId) {
    if (!StringUtils.hasText(listingId)) {
      return;
    }

    elasticsearchOperations.delete(listingId.trim(), LISTING_INDEX);
  }

  @Override
  public List<ListingDocument> searchListings(ListingSearchRequest request) {
    ListingSearchRequest safeRequest = request == null ? ListingSearchRequest.builder().build() : request;
    int normalizedPage = ElasticsearchNativeQueryHelper.normalizePage(safeRequest.getPage());
    int normalizedPageSize =
        ElasticsearchNativeQueryHelper.normalizePageSize(safeRequest.getPageSize(), defaultPageSize);
    boolean geoRadiusFilterEnabled =
        ElasticsearchNativeQueryHelper.hasGeoRadiusFilter(safeRequest.getLatitude(), safeRequest.getLongitude(),
            safeRequest.getRadiusMeters());
    Pageable pageable = PageRequest.of(normalizedPage, normalizedPageSize);
    NativeQuery query = buildNativeQuery(safeRequest, pageable, geoRadiusFilterEnabled);

    SearchHits<ListingDocument> hits = elasticsearchOperations.search(query, ListingDocument.class, LISTING_INDEX);
    List<ListingDocument> results = new ArrayList<>();
    for (SearchHit<ListingDocument> hit : hits) {
      results.add(hit.getContent());
    }
    return results;
  }

  private NativeQuery buildNativeQuery(
      ListingSearchRequest request,
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
            ElasticsearchNativeQueryHelper.listingKeywordSearchFields()),
        filter -> {
          ElasticsearchNativeQueryHelper.addStandardLocationFilters(
              filter, request.getFacilityId(), request.getProvinceCode(), request.getWardCode());
          ElasticsearchNativeQueryHelper.addCategoryIdsMatchAllFilterIfPresent(filter, request.getCategoryIds());
          ElasticsearchNativeQueryHelper.addSubCategoryIdsMatchAllFilterIfPresent(
              filter, request.getSubCategoryIds());
          ElasticsearchNativeQueryHelper.addTermIfPresent(filter, "status", request.getProductStatus());
          ElasticsearchNativeQueryHelper.addTermIfPresent(filter, "listingType", request.getListingType());
          ElasticsearchNativeQueryHelper.addTermIfPresent(filter, "listingStatus", request.getListingStatus());
          Double priceMin = request.getPriceMin();
          Double priceMax = request.getPriceMax();
          if (priceMin != null || priceMax != null) {
            filter.add(ElasticsearchNativeQueryHelper.overlapPriceRangeQuery(priceMin, priceMax));
          }
          ElasticsearchNativeQueryHelper.addGeoDistanceFilterIfEnabled(
              filter, geoRadiusFilterEnabled, lat, lon, radiusMeters);
        });
  }

}
