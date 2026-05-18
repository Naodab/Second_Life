package com.naodab.productservice.services.impl;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.mapping.IndexCoordinates;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.naodab.productservice.documents.ListingDocument;
import com.naodab.productservice.dto.request.ListingSearchRequest;
import com.naodab.productservice.elasticsearch.ElasticsearchNativeQueryHelper;
import com.naodab.productservice.models.Listing;
import com.naodab.productservice.repositories.ListingRepository;
import com.naodab.productservice.services.ListingSearchService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class ListingSearchServiceImpl implements ListingSearchService {
  static final IndexCoordinates LISTING_INDEX = IndexCoordinates.of("listings");

  ElasticsearchOperations elasticsearchOperations;
  ListingElasticsearchIndexWriter listingElasticsearchIndexWriter;
  ListingRepository listingRepository;

  @NonFinal
  @Value("${default.page-size:20}")
  int defaultPageSize;

  @Override
  public void sync(Listing listing) {
    if (listing == null || !StringUtils.hasText(listing.getId())) {
      return;
    }
    try {
      listingElasticsearchIndexWriter.writeListingDocumentById(listing.getId().trim());
    } catch (Exception e) {
      log.error("Elasticsearch sync failed for listing id={}", listing.getId(), e);
    }
  }

  @Override
  @Transactional(readOnly = true)
  public int reindexAllListingsFromDatabase() {
    int batchSize = 50;
    int total = 0;
    Pageable pageable = PageRequest.of(0, batchSize);
    Page<String> idPage;
    do {
      idPage = listingRepository.findIdsForElasticsearchReindex(pageable);
      List<String> ids = idPage.getContent();
      if (ids.isEmpty()) {
        break;
      }
      for (String id : ids) {
        try {
          listingElasticsearchIndexWriter.writeListingDocumentById(id);
          total++;
        } catch (Exception e) {
          log.error("Elasticsearch listing reindex failed for id={}", id, e);
        }
      }
      pageable = idPage.nextPageable();
    } while (idPage.hasNext());
    log.info("Elasticsearch listings reindex finished: {} documents written", total);
    return total;
  }

  @Override
  public void reindexAllListingsForProduct(String productId) {
    if (!StringUtils.hasText(productId)) {
      return;
    }
    for (String id : listingRepository.findIdsByProductId(productId.trim())) {
      try {
        listingElasticsearchIndexWriter.writeListingDocumentById(id);
      } catch (Exception e) {
        log.error("Elasticsearch reindex failed for listing id={} productId={}", id, productId, e);
      }
    }
  }

  @Override
  public void deleteListingsIndexByProductId(String productId) {
    if (!StringUtils.hasText(productId)) {
      return;
    }
    for (String id : listingRepository.findListingIdsByProductId(productId.trim())) {
      try {
        delete(id);
      } catch (Exception e) {
        log.error("Elasticsearch delete listing index failed id={} productId={}", id, productId, e);
      }
    }
  }

  @Override
  public void delete(String listingId) {
    if (!StringUtils.hasText(listingId)) {
      return;
    }

    elasticsearchOperations.delete(listingId.trim(), LISTING_INDEX);
  }

  @Override
  public long removeAllListingDocumentsFromIndex() {
    long removed = 0L;
    Pageable pageable = PageRequest.of(0, 500);
    Page<String> idPage;
    do {
      idPage = listingRepository.findAllListingIds(pageable);
      for (String id : idPage.getContent()) {
        if (StringUtils.hasText(id)) {
          try {
            elasticsearchOperations.delete(id.trim(), LISTING_INDEX);
            removed++;
          } catch (Exception e) {
            log.warn("Elasticsearch delete listing id={} failed: {}", id, e.getMessage());
          }
        }
      }
      pageable = idPage.nextPageable();
    } while (idPage.hasNext());
    log.info("Removed {} listing document(s) from Elasticsearch index", removed);
    return removed;
  }

  @Override
  public ListingDocumentPage searchListingsPaged(ListingSearchRequest request) {
    ListingSearchRequest safeRequest = request == null ? ListingSearchRequest.builder().build() : request;
    int normalizedPage = ElasticsearchNativeQueryHelper.normalizePage(safeRequest.getPage());
    int normalizedPageSize = ElasticsearchNativeQueryHelper.normalizePageSize(safeRequest.getPageSize(),
        defaultPageSize);
    boolean geoRadiusFilterEnabled = ElasticsearchNativeQueryHelper.hasGeoRadiusFilter(safeRequest.getLatitude(),
        safeRequest.getLongitude(),
        safeRequest.getRadiusMeters());
    Pageable pageable = PageRequest.of(normalizedPage, normalizedPageSize);
    NativeQuery query = buildNativeQuery(safeRequest, pageable, geoRadiusFilterEnabled);

    SearchHits<ListingDocument> hits = elasticsearchOperations.search(query, ListingDocument.class, LISTING_INDEX);
    List<ListingDocument> results = new ArrayList<>();
    for (SearchHit<ListingDocument> hit : hits) {
      results.add(hit.getContent());
    }
    return new ListingDocumentPage(results, hits.getTotalHits());
  }

  @Override
  public List<ListingDocument> searchListings(ListingSearchRequest request) {
    return searchListingsPaged(request).items();
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
          ElasticsearchNativeQueryHelper.addTermIfTextPresent(filter, "productId", request.getProductId());
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
