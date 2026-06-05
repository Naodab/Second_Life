package com.naodab.productservice.services;

import java.util.List;

import com.naodab.productservice.dto.request.CartItemAddRequest;
import com.naodab.productservice.dto.request.CartItemUpdateRequest;
import com.naodab.productservice.dto.response.CartItemResponse;

public interface CartService {

  List<CartItemResponse> listCartItems(String profileId);

  CartItemResponse addCartItem(String profileId, CartItemAddRequest request);

  CartItemResponse updateCartItem(String profileId, String cartItemId, CartItemUpdateRequest request);

  void removeCartItem(String profileId, String cartItemId);

  void clearCart(String profileId);
}
