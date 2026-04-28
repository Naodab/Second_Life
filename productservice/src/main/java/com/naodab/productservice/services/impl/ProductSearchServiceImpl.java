package com.naodab.productservice.services.impl;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.mapping.IndexCoordinates;
import org.springframework.data.elasticsearch.core.query.Criteria;
import org.springframework.data.elasticsearch.core.query.CriteriaQuery;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.naodab.productservice.dto.request.ProductSearchRequest;
import com.naodab.productservice.documents.ProductDocument;
import com.naodab.productservice.mapper.ProductMapper;
import com.naodab.productservice.models.Product;
import com.naodab.productservice.services.ProductSearchService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class ProductSearchServiceImpl implements ProductSearchService {
  static final float EARTH_RADIUS_METERS = 6_371_000F;
  static final float METERS_PER_LATITUDE_DEGREE = 111_320F;
  static final IndexCoordinates PRODUCT_INDEX = IndexCoordinates.of("products");

  ElasticsearchOperations elasticsearchOperations;
  ProductMapper productMapper;

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
  public List<String> searchProductIds(ProductSearchRequest request) {
    ProductSearchRequest safeRequest = request == null ? ProductSearchRequest.builder().build() : request;
    int normalizedPage = normalizePage(safeRequest.getPage());
    int normalizedPageSize = normalizePageSize(safeRequest.getPageSize());
    boolean geoRadiusFilterEnabled = hasGeoRadiusFilter(safeRequest);

    Criteria criteria = buildCriteria(safeRequest, geoRadiusFilterEnabled);
    CriteriaQuery query = new CriteriaQuery(criteria);
    if (!geoRadiusFilterEnabled) {
      query.setPageable(PageRequest.of(normalizedPage, normalizedPageSize));
    }

    SearchHits<ProductDocument> hits = elasticsearchOperations.search(query, ProductDocument.class);
    List<ProductDocument> documents = new ArrayList<>();
    for (SearchHit<ProductDocument> hit : hits) {
      documents.add(hit.getContent());
    }

    if (geoRadiusFilterEnabled) {
      documents = documents.stream()
          .filter(document -> isWithinRadius(document, safeRequest))
          .sorted(Comparator.comparingDouble(
              document -> distanceMeters(document, safeRequest.getLatitude(), safeRequest.getLongitude())))
          .skip((long) normalizedPage * normalizedPageSize)
          .limit(normalizedPageSize)
          .toList();
    }

    return documents.stream().map(ProductDocument::getId).toList();
  }

  private Criteria buildCriteria(ProductSearchRequest request, boolean geoRadiusFilterEnabled) {
    Criteria criteria = Criteria.where("id").exists();

    if (StringUtils.hasText(request.getKeyword())) {
      String normalizedKeyword = request.getKeyword().trim();
      Criteria keywordCriteria = new Criteria("name").contains(normalizedKeyword)
          .or(new Criteria("description").contains(normalizedKeyword))
          .or(new Criteria("attributeValues").contains(normalizedKeyword))
          .or(new Criteria("variantSkus").contains(normalizedKeyword));
      criteria = criteria.and(keywordCriteria);
    }

    if (StringUtils.hasText(request.getFacilityId())) {
      criteria = criteria.and(new Criteria("facilityId").is(request.getFacilityId().trim()));
    }

    if (StringUtils.hasText(request.getProvinceCode())) {
      criteria = criteria.and(new Criteria("provinceCode").is(request.getProvinceCode().trim()));
    }

    if (StringUtils.hasText(request.getWardCode())) {
      criteria = criteria.and(new Criteria("wardCode").is(request.getWardCode().trim()));
    }

    if (geoRadiusFilterEnabled) {
      float latDelta = request.getRadiusMeters() / METERS_PER_LATITUDE_DEGREE;
      float longitudeScale = (float) Math.cos(Math.toRadians(request.getLatitude()));
      float metersPerLongitudeDegree = Math.max(1F, METERS_PER_LATITUDE_DEGREE * Math.abs(longitudeScale));
      float lonDelta = request.getRadiusMeters() / metersPerLongitudeDegree;
      criteria = criteria
          .and(new Criteria("latitude").between(request.getLatitude() - latDelta, request.getLatitude() + latDelta));
      criteria = criteria
          .and(new Criteria("longitude").between(request.getLongitude() - lonDelta, request.getLongitude() + lonDelta));
    }

    if (request.getStatus() != null) {
      criteria = criteria.and(new Criteria("status").is(request.getStatus().name()));
    }

    return criteria;
  }

  private int normalizePage(Integer page) {
    return page == null || page < 0 ? 0 : page;
  }

  private int normalizePageSize(Integer pageSize) {
    return pageSize == null || pageSize <= 0 ? 20 : pageSize;
  }

  private boolean hasGeoRadiusFilter(ProductSearchRequest request) {
    return request.getLatitude() != null
        && request.getLongitude() != null
        && request.getRadiusMeters() != null
        && request.getRadiusMeters() > 0;
  }

  private boolean isWithinRadius(ProductDocument document, ProductSearchRequest request) {
    if (document.getLatitude() == null || document.getLongitude() == null) {
      return false;
    }

    return distanceMeters(document, request.getLatitude(), request.getLongitude()) <= request.getRadiusMeters();
  }

  private double distanceMeters(ProductDocument document, float latitude, float longitude) {
    double lat1 = Math.toRadians(latitude);
    double lon1 = Math.toRadians(longitude);
    double lat2 = Math.toRadians(document.getLatitude());
    double lon2 = Math.toRadians(document.getLongitude());

    double deltaLat = lat2 - lat1;
    double deltaLon = lon2 - lon1;
    double a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2)
        + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_METERS * c;
  }
}
