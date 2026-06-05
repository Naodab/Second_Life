package com.naodab.productservice.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.naodab.commonservice.constant.AppConstants;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.commonservice.response.ApiResponse;
import com.naodab.productservice.dto.request.CartItemAddRequest;
import com.naodab.productservice.dto.request.CartItemUpdateRequest;
import com.naodab.productservice.dto.response.CartItemResponse;
import com.naodab.productservice.services.CartService;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/cart")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CartController {

  CartService cartService;

  @GetMapping
  public ResponseEntity<ApiResponse<List<CartItemResponse>>> listCartItems(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader) {
    String profileId = validateProfileId(profileIdHeader);
    return ResponseEntity.ok(ApiResponse.<List<CartItemResponse>>builder()
        .data(cartService.listCartItems(profileId))
        .build());
  }

  @PostMapping
  public ResponseEntity<ApiResponse<CartItemResponse>> addCartItem(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader,
      @RequestBody @Valid CartItemAddRequest request) {
    String profileId = validateProfileId(profileIdHeader);
    return ResponseEntity.ok(ApiResponse.<CartItemResponse>builder()
        .data(cartService.addCartItem(profileId, request))
        .build());
  }

  @PatchMapping("/{id}")
  public ResponseEntity<ApiResponse<CartItemResponse>> updateCartItem(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader,
      @PathVariable String id,
      @RequestBody @Valid CartItemUpdateRequest request) {
    String profileId = validateProfileId(profileIdHeader);
    return ResponseEntity.ok(ApiResponse.<CartItemResponse>builder()
        .data(cartService.updateCartItem(profileId, id, request))
        .build());
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> removeCartItem(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader,
      @PathVariable String id) {
    String profileId = validateProfileId(profileIdHeader);
    cartService.removeCartItem(profileId, id);
    return ResponseEntity.noContent().build();
  }

  @DeleteMapping
  public ResponseEntity<Void> clearCart(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader) {
    String profileId = validateProfileId(profileIdHeader);
    cartService.clearCart(profileId);
    return ResponseEntity.noContent().build();
  }

  private String validateProfileId(String profileIdHeader) {
    if (profileIdHeader == null || profileIdHeader.isBlank()) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    return profileIdHeader.trim();
  }
}
