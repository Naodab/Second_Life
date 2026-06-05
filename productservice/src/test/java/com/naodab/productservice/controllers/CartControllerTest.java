package com.naodab.productservice.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.naodab.commonservice.constant.AppConstants;
import com.naodab.commonservice.exception.GlobalExceptionHandler;
import com.naodab.productservice.dto.request.CartItemAddRequest;
import com.naodab.productservice.dto.request.CartItemUpdateRequest;
import com.naodab.productservice.dto.response.CartItemResponse;
import com.naodab.productservice.models.CartMode;
import com.naodab.productservice.models.Listing.ListingType;
import com.naodab.productservice.services.CartService;

@WebMvcTest(controllers = CartController.class)
@TestPropertySource(properties = "server.servlet.context-path=/")
@Import({ GlobalExceptionHandler.class, CartController.class })
class CartControllerTest {

  @Autowired
  MockMvc mockMvc;

  @Autowired
  ObjectMapper objectMapper;

  @MockitoBean
  CartService cartService;

  @Test
  void listCartItems_delegates() throws Exception {
    CartItemResponse item = CartItemResponse.builder()
        .id("cart-1")
        .listingId("listing-1")
        .listingVariantId("variant-1")
        .quantity(1)
        .mode(CartMode.BUY)
        .listingType(ListingType.BUY)
        .addedAt(LocalDateTime.of(2026, 6, 5, 10, 0))
        .build();
    when(cartService.listCartItems("profile-1")).thenReturn(List.of(item));

    mockMvc.perform(get("/cart").header(AppConstants.HEADER_PROFILE_ID, "profile-1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[0].id").value("cart-1"))
        .andExpect(jsonPath("$.data[0].quantity").value(1));
  }

  @Test
  void addCartItem_delegates() throws Exception {
    CartItemAddRequest request = CartItemAddRequest.builder()
        .listingId("listing-1")
        .listingVariantId("variant-1")
        .quantity(2)
        .mode(CartMode.BUY)
        .build();
    CartItemResponse response = CartItemResponse.builder()
        .id("cart-new")
        .listingId("listing-1")
        .listingVariantId("variant-1")
        .quantity(2)
        .mode(CartMode.BUY)
        .build();
    when(cartService.addCartItem(eq("profile-1"), any(CartItemAddRequest.class))).thenReturn(response);

    mockMvc.perform(post("/cart")
            .header(AppConstants.HEADER_PROFILE_ID, "profile-1")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.id").value("cart-new"))
        .andExpect(jsonPath("$.data.quantity").value(2));
  }

  @Test
  void updateCartItem_delegates() throws Exception {
    CartItemUpdateRequest request = CartItemUpdateRequest.builder().quantity(3).build();
    CartItemResponse response = CartItemResponse.builder()
        .id("cart-1")
        .quantity(3)
        .mode(CartMode.BUY)
        .build();
    when(cartService.updateCartItem(eq("profile-1"), eq("cart-1"), any(CartItemUpdateRequest.class)))
        .thenReturn(response);

    mockMvc.perform(patch("/cart/cart-1")
            .header(AppConstants.HEADER_PROFILE_ID, "profile-1")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.quantity").value(3));
  }

  @Test
  void removeCartItem_returnsNoContent() throws Exception {
    mockMvc.perform(delete("/cart/cart-1").header(AppConstants.HEADER_PROFILE_ID, "profile-1"))
        .andExpect(status().isNoContent());

    verify(cartService).removeCartItem("profile-1", "cart-1");
  }

  @Test
  void clearCart_returnsNoContent() throws Exception {
    mockMvc.perform(delete("/cart").header(AppConstants.HEADER_PROFILE_ID, "profile-1"))
        .andExpect(status().isNoContent());

    verify(cartService).clearCart("profile-1");
  }

  @Test
  void listCartItems_missingProfile_returnsBadRequest() throws Exception {
    mockMvc.perform(get("/cart"))
        .andExpect(status().isBadRequest());
  }
}
