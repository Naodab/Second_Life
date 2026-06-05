package com.naodab.productservice.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.naodab.commonservice.response.ApiResponse;
import com.naodab.productservice.services.FacilityService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/listing-variants")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ListingVariantController {

  FacilityService facilityService;

  @GetMapping("/{id}/owner-profile-id")
  public ResponseEntity<ApiResponse<String>> resolveOwnerProfileId(@PathVariable String id) {
    return ResponseEntity.ok(ApiResponse.<String>builder()
        .data(facilityService.resolveOwnerProfileIdByListingVariantId(id))
        .build());
  }
}
