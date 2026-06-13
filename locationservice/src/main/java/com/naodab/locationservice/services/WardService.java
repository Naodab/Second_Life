package com.naodab.locationservice.services;

import java.util.List;

import com.naodab.locationservice.dto.request.WardSearchRequest;
import com.naodab.locationservice.dto.response.CoordinateResolveResponse;
import com.naodab.locationservice.dto.response.WardResponse;

public interface WardService {
  WardResponse getWard(String code);

  List<WardResponse> getWards(WardSearchRequest request, int page, int pageSize);

  List<WardResponse> getWardsWithinRadius(Float lat, Float lon, Float radiusMeters, int page, int pageSize);

  List<WardResponse> getWardsByLonAndLat(Float lon, Float lat, int page, int pageSize);

  List<WardResponse> getWardsByLonAndLatWithoutPagination(Float lon, Float lat);

  CoordinateResolveResponse resolveCoordinates(Float lon, Float lat);

  List<WardResponse> getAllWithoutPagination(WardSearchRequest request);

  boolean isLocationValid(String provinceCode, String wardCode, Float latitude, Float longitude);

}
