package com.naodab.productservice.services.impl;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.naodab.productservice.client.LocationClient;
import com.naodab.productservice.dto.request.ListingRecommendationRequest;
import com.naodab.productservice.dto.request.ListingSearchRequest;
import com.naodab.productservice.dto.response.ListingItemResponse;
import com.naodab.productservice.dto.search.SearchHistorySnapshot;
import com.naodab.productservice.elasticsearch.ElasticsearchSortBy;
import com.naodab.productservice.mapper.ListingMapper;
import com.naodab.productservice.models.Listing;
import com.naodab.productservice.models.Product.ProductStatus;
import com.naodab.productservice.elasticsearch.ElasticsearchNativeQueryHelper;
import com.naodab.productservice.services.ListingRecommendationService;
import com.naodab.productservice.services.ListingSearchService;
import com.naodab.productservice.services.SearchHistoryPersistService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ListingRecommendationServiceImpl implements ListingRecommendationService {

  static final float DEFAULT_RADIUS_METERS = 50_000f;

  SearchHistoryPersistService searchHistoryPersistService;
  ListingSearchService listingSearchService;
  ListingMapper listingMapper;
  LocationClient locationClient;

  @NonFinal
  @Value("${default.page-size:20}")
  int defaultListingPageSize;

  @Override
  public List<ListingItemResponse> recommend(String profileId, ListingRecommendationRequest body) {
    ListingRecommendationRequest req = body == null ? ListingRecommendationRequest.builder().build() : body;
    int limit = req.getLimit() == null || req.getLimit() < 1 ? 12 : Math.min(req.getLimit(), 50);
    LocationContext loc = resolveLocation(req);
    loc = enrichLocationFromHistoryIfNeeded(loc, profileId);

    List<SearchHistorySnapshot> snapshots = searchHistoryPersistService.loadSnapshotsOrderedNewestFirst(profileId);
    List<IndexedSnapshot> ordered = orderSnapshots(snapshots);

    LinkedHashSet<String> seenIds = new LinkedHashSet<>();
    List<ListingItemResponse> out = new ArrayList<>();

    int slice = Math.min(Math.max(limit, 8), defaultListingPageSize);
    for (IndexedSnapshot is : ordered) {
      appendUnique(out, seenIds, runSearch(buildRequestFromSnapshot(is.snapshot(), loc, slice)));
      if (out.size() >= limit) {
        return out.subList(0, limit);
      }
    }

    if (out.size() < limit) {
      appendUnique(out, seenIds, runSearch(browseNear(loc, slice)));
    }
    return out.size() > limit ? out.subList(0, limit) : out;
  }

  private LocationContext enrichLocationFromHistoryIfNeeded(LocationContext loc, String profileId) {
    if (loc.hasAnyLocation()) {
      return loc;
    }
    List<SearchHistorySnapshot> snaps = searchHistoryPersistService.loadSnapshotsOrderedNewestFirst(profileId);
    for (SearchHistorySnapshot s : snaps) {
      String pc = trim(s.getProvinceCode());
      if (StringUtils.hasText(pc)) {
        return new LocationContext(
            pc,
            trim(s.getWardCode()),
            loc.latitude,
            loc.longitude,
            loc.radiusMeters);
      }
    }
    return loc;
  }

  private List<IndexedSnapshot> orderSnapshots(List<SearchHistorySnapshot> snapshots) {
    if (snapshots == null || snapshots.isEmpty()) {
      return List.of();
    }
    List<IndexedSnapshot> rows = new ArrayList<>();
    for (int i = 0; i < snapshots.size(); i++) {
      rows.add(new IndexedSnapshot(i, snapshots.get(i)));
    }
    rows.sort(
        Comparator.comparingInt((IndexedSnapshot r) -> -focusScore(r.snapshot()))
            .thenComparingInt(IndexedSnapshot::index));
    return rows;
  }

  private static int focusScore(SearchHistorySnapshot s) {
    int score = 0;
    if (StringUtils.hasText(s.getKeyword())) {
      score += 4;
    }
    if (s.getSubCategoryIds() != null && !s.getSubCategoryIds().isEmpty()) {
      score += 2;
    }
    if (s.getCategoryIds() != null && !s.getCategoryIds().isEmpty()) {
      score += 1;
    }
    return score;
  }

  private List<ListingItemResponse> runSearch(ListingSearchRequest r) {
    return listingSearchService.searchListingsPaged(r).items().stream()
        .map(listingMapper::toListingItemResponse)
        .filter(x -> x != null)
        .toList();
  }

  private void appendUnique(List<ListingItemResponse> out, LinkedHashSet<String> seenIds, List<ListingItemResponse> slice) {
    for (ListingItemResponse it : slice) {
      if (it == null || !StringUtils.hasText(it.getId())) {
        continue;
      }
      if (seenIds.add(it.getId())) {
        out.add(it);
      }
    }
  }

  private LocationContext resolveLocation(ListingRecommendationRequest req) {
    Float lat = req.getLatitude();
    Float lon = req.getLongitude();
    String pc = trim(req.getProvinceCode());
    String wc = trim(req.getWardCode());
    Float radius =
        req.getRadiusMeters() == null || req.getRadiusMeters() <= 0 ? DEFAULT_RADIUS_METERS : req.getRadiusMeters();

    Optional<LocationClient.ResolvedAdministrativeCodes> geoCodes = Optional.empty();
    if ((!StringUtils.hasText(pc)) && lat != null && lon != null) {
      geoCodes = locationClient.resolveProvinceWardFromLonLat(lon, lat);
      if (geoCodes.isPresent()) {
        pc = geoCodes.get().provinceCode();
        wc = geoCodes.get().wardCode();
      }
    }

    return new LocationContext(pc, wc, lat, lon, radius);
  }

  private ListingSearchRequest browseNear(LocationContext ctx, int pageSize) {
    ElasticsearchSortBy sort =
        ElasticsearchNativeQueryHelper.hasGeoRadiusFilter(ctx.latitude, ctx.longitude, ctx.radiusMeters)
            ? ElasticsearchSortBy.DISTANCE
            : ElasticsearchSortBy.UPDATED_AT_DESC;
    int ps = ElasticsearchNativeQueryHelper.normalizePageSize(pageSize, defaultListingPageSize);
    var b =
        ListingSearchRequest.builder()
            .provinceCode(trim(ctx.provinceCode()))
            .wardCode(trim(ctx.wardCode()))
            .latitude(ctx.latitude())
            .longitude(ctx.longitude())
            .radiusMeters(ctx.radiusMeters())
            .listingStatus(Listing.ListingStatus.ACTIVE)
            .productStatus(ProductStatus.PUBLISHED)
            .sortBy(sort)
            .page(0)
            .pageSize(ps);
    return b.build();
  }

  private ListingSearchRequest buildRequestFromSnapshot(SearchHistorySnapshot snap, LocationContext ctx, int pageSize) {
    int ps = ElasticsearchNativeQueryHelper.normalizePageSize(pageSize, defaultListingPageSize);

    boolean hasKeyword = StringUtils.hasText(snap.getKeyword());
    boolean geoOk = ElasticsearchNativeQueryHelper.hasGeoRadiusFilter(ctx.latitude, ctx.longitude, ctx.radiusMeters);
    ElasticsearchSortBy sort =
        hasKeyword ? ElasticsearchSortBy.RELEVANCE : geoOk ? ElasticsearchSortBy.DISTANCE : ElasticsearchSortBy.UPDATED_AT_DESC;

    String pc =
        trim(ctx.provinceCode()) != null
            ? trim(ctx.provinceCode())
            : trim(snap.getProvinceCode());
    String wc =
        trim(ctx.wardCode()) != null ? trim(ctx.wardCode()) : trim(snap.getWardCode());

    Float lat = ctx.latitude();
    Float lon = ctx.longitude();
    Float radius = ctx.radiusMeters();

    return ListingSearchRequest.builder()
        .keyword(hasKeyword ? snap.getKeyword().trim() : null)
        .categoryIds(copyList(snap.getCategoryIds()))
        .subCategoryIds(copyList(snap.getSubCategoryIds()))
        .listingType(snap.getListingType())
        .priceMin(snap.getPriceMin())
        .priceMax(snap.getPriceMax())
        .provinceCode(pc)
        .wardCode(wc)
        .latitude(lat)
        .longitude(lon)
        .radiusMeters(radius)
        .listingStatus(Listing.ListingStatus.ACTIVE)
        .productStatus(ProductStatus.PUBLISHED)
        .sortBy(sort)
        .page(0)
        .pageSize(ps)
        .build();
  }

  private static List<String> copyList(List<String> ids) {
    if (ids == null || ids.isEmpty()) {
      return null;
    }
    List<String> out = new ArrayList<>();
    LinkedHashSet<String> seen = new LinkedHashSet<>();
    for (String id : ids) {
      if (StringUtils.hasText(id) && seen.add(id.trim())) {
        out.add(id.trim());
      }
    }
    return out.isEmpty() ? null : out;
  }

  private static String trim(String s) {
    return ListingRecommendationService.trimNullable(s);
  }

  record IndexedSnapshot(int index, SearchHistorySnapshot snapshot) {
  }

  record LocationContext(
      String provinceCode,
      String wardCode,
      Float latitude,
      Float longitude,
      Float radiusMeters) {

    boolean hasAnyLocation() {
      return StringUtils.hasText(provinceCode)
          || latitude != null && longitude != null && radiusMeters != null && radiusMeters > 0;
    }
  }
}
