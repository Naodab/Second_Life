package com.naodab.locationservice.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.commonservice.response.ApiResponse;
import com.naodab.locationservice.dto.request.WardSearchRequest;
import com.naodab.locationservice.dto.response.WardResponse;
import com.naodab.locationservice.services.WardService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/wards")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class WardControlller {
  WardService wardService;

  @GetMapping("/{code}")
  public ResponseEntity<ApiResponse<WardResponse>> getWard(@PathVariable String code) {
    return ResponseEntity.ok(
        ApiResponse.<WardResponse>builder()
            .data(wardService.getWard(code))
            .build());
  }

  @GetMapping
  public ResponseEntity<ApiResponse<List<WardResponse>>> getWards(
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer pageSize,
      @RequestParam(required = false) String name,
      @RequestParam(required = false) String provinceCode) {

    WardSearchRequest request = WardSearchRequest.builder().name(name).provinceCode(provinceCode).build();
    List<WardResponse> data = page == null || pageSize == null
        ? wardService.getAllWithoutPagination(request)
        : wardService.getWards(request, page, pageSize);

    return ResponseEntity.ok(
        ApiResponse.<List<WardResponse>>builder()
            .data(data)
            .build());
  }

  @GetMapping("/radius")
  public ResponseEntity<ApiResponse<List<WardResponse>>> getWardsWithinRadius(
      @RequestParam(required = false) Float lat,
      @RequestParam(required = false) Float lon,
      @RequestParam(required = false) Float radiusMeters,
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer pageSize) {
    if (lat == null || lon == null || radiusMeters == null) {
      return ResponseEntity.badRequest().body(
          ApiResponse.<List<WardResponse>>builder()
              .message("Lat, lon and radiusMeters are required")
              .code(ErrorCode.INVALID_INPUT.getCode())
              .build());
    }

    List<WardResponse> data = page == null || pageSize == null
        ? wardService.getWardsByLonAndLatWithoutPagination(lon, lat)
        : wardService.getWardsWithinRadius(lat, lon, radiusMeters, page, pageSize);

    return ResponseEntity.ok(
        ApiResponse.<List<WardResponse>>builder()
            .data(data)
            .build());
  }

  @GetMapping("/lon-lat")
  public ResponseEntity<ApiResponse<List<WardResponse>>> getWardsByLonAndLat(
      @RequestParam(required = false) Float lon,
      @RequestParam(required = false) Float lat,
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer pageSize) {
    if (lon == null || lat == null) {
      return ResponseEntity.badRequest().body(
          ApiResponse.<List<WardResponse>>builder()
              .message("Lon and lat are required")
              .code(ErrorCode.INVALID_INPUT.getCode())
              .build());
    }

    List<WardResponse> data = page == null || pageSize == null
        ? wardService.getWardsByLonAndLatWithoutPagination(lon, lat)
        : wardService.getWardsByLonAndLat(lon, lat, page, pageSize);

    return ResponseEntity.ok(
        ApiResponse.<List<WardResponse>>builder()
            .data(data)
            .build());
  }
}
