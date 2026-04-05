package com.naodab.locationservice.services;

import java.util.List;

import com.naodab.locationservice.dto.request.ProvinceSearchRequest;
import com.naodab.locationservice.dto.response.ProvinceResponse;

public interface ProvinceService {
  ProvinceResponse getProvince(String code);

  List<ProvinceResponse> getProvinces(ProvinceSearchRequest request, int page, int pageSize);

  List<ProvinceResponse> getProvincesWithinRadius(Float lat, Float lon, Float radiusMeters, int page, int pageSize);

  List<ProvinceResponse> getProvincesByLonAndLat(Float lon, Float lat, int page, int pageSize);

  List<ProvinceResponse> getProvincesByLonAndLatWithoutPagination(Float lon, Float lat);

  List<ProvinceResponse> getProvincesWithoutPagination(ProvinceSearchRequest request);

  List<ProvinceResponse> getAllWithoutPagination();
}
