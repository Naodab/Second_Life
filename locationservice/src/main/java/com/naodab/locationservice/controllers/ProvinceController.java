package com.naodab.locationservice.controllers;

import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.commonservice.response.ApiResponse;
import com.naodab.locationservice.dto.request.ProvinceSearchRequest;
import com.naodab.locationservice.dto.response.ProvinceResponse;
import com.naodab.locationservice.services.ProvinceService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/provinces")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class ProvinceController {
  ProvinceService provinceService;

  @GetMapping("/{code}")
  public ResponseEntity<ApiResponse<ProvinceResponse>> getProvince(@PathVariable String code) {
    return ResponseEntity.ok(
        ApiResponse.<ProvinceResponse>builder()
            .data(provinceService.getProvince(code))
            .build());
  }

  @GetMapping
  public ResponseEntity<ApiResponse<List<ProvinceResponse>>> getProvinces(
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer pageSize,
      @RequestParam(required = false) String name) {

    ProvinceSearchRequest request = ProvinceSearchRequest.builder().name(name).build();
    List<ProvinceResponse> data = page == null || pageSize == null
        ? provinceService.getProvincesWithoutPagination(request)
        : provinceService.getProvinces(request, page, pageSize);

    return ResponseEntity.ok(
        ApiResponse.<List<ProvinceResponse>>builder()
            .data(data)
            .build());
  }

  @GetMapping("/radius")
  public ResponseEntity<ApiResponse<List<ProvinceResponse>>> getProvincesWithinRadius(
      @RequestParam(required = false) Float lat,
      @RequestParam(required = false) Float lon,
      @RequestParam(required = false) Float radiusMeters,
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer pageSize) {

    if (lat == null || lon == null || radiusMeters == null) {
      return ResponseEntity.badRequest().body(
          ApiResponse.<List<ProvinceResponse>>builder()
              .message("Lat, lon and radiusMeters are required")
              .code(ErrorCode.INVALID_INPUT.getCode())
              .build());
    }

    List<ProvinceResponse> data = page == null || pageSize == null
        ? provinceService.getProvincesByLonAndLatWithoutPagination(lon, lat)
        : provinceService.getProvincesWithinRadius(lat, lon, radiusMeters, page, pageSize);

    return ResponseEntity.ok(
        ApiResponse.<List<ProvinceResponse>>builder()
            .data(data)
            .build());
  }

  @GetMapping("/lon-lat")
  public ResponseEntity<ApiResponse<List<ProvinceResponse>>> getProvincesByLonAndLat(
      @RequestParam(required = false) Float lon,
      @RequestParam(required = false) Float lat,
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer pageSize) {

    if (lon == null || lat == null) {
      return ResponseEntity.badRequest().body(
          ApiResponse.<List<ProvinceResponse>>builder()
              .message("Lon and lat are required")
              .code(ErrorCode.INVALID_INPUT.getCode())
              .build());
    }

    List<ProvinceResponse> data = page == null || pageSize == null
        ? provinceService.getProvincesByLonAndLatWithoutPagination(lon, lat)
        : provinceService.getProvincesByLonAndLat(lon, lat, page, pageSize);

    return ResponseEntity.ok(
        ApiResponse.<List<ProvinceResponse>>builder()
            .data(data)
            .build());
  }
}
