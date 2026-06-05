package com.naodab.productservice.services.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.productservice.dto.request.CartItemAddRequest;
import com.naodab.productservice.dto.request.CartItemUpdateRequest;
import com.naodab.productservice.dto.response.CartItemResponse;
import com.naodab.productservice.dto.response.ListingVariantContextResponse;
import com.naodab.productservice.models.CartItem;
import com.naodab.productservice.models.CartMode;
import com.naodab.productservice.models.Listing;
import com.naodab.productservice.models.Listing.ListingStatus;
import com.naodab.productservice.models.Listing.ListingType;
import com.naodab.productservice.models.ListingVariant;
import com.naodab.productservice.models.ListingVariant.RentUnit;
import com.naodab.productservice.models.Product;
import com.naodab.productservice.models.Product.ProductStatus;
import com.naodab.productservice.repositories.CartItemRepository;
import com.naodab.productservice.repositories.ListingVariantRepository;
import com.naodab.productservice.services.ListingService;

@ExtendWith(MockitoExtension.class)
class CartServiceImplTest {

  @Mock
  CartItemRepository cartItemRepository;

  @Mock
  ListingVariantRepository listingVariantRepository;

  @Mock
  ListingService listingService;

  @InjectMocks
  CartServiceImpl cartService;

  @Test
  void listCartItems_returnsEnrichedItems() {
    CartItem item = activeBuyCartItem();
    when(cartItemRepository.findByProfileIdAndDeletedAtIsNullOrderByCreatedAtDesc("profile-1"))
        .thenReturn(List.of(item));
    when(listingService.getListingVariantContext("variant-1")).thenReturn(sampleContext());

    List<CartItemResponse> result = cartService.listCartItems("profile-1");

    assertThat(result).hasSize(1);
    assertThat(result.get(0).getId()).isEqualTo("cart-1");
    assertThat(result.get(0).getTitle()).isEqualTo("Listing title");
    assertThat(result.get(0).getBuyPrice()).isEqualTo(100_000d);
  }

  @Test
  void addCartItem_buy_savesItem() {
    ListingVariant variant = activeBuyVariant();
    when(listingVariantRepository.findById("variant-1")).thenReturn(Optional.of(variant));
    when(listingVariantRepository.existsByIdAndListing_Id("variant-1", "listing-1")).thenReturn(true);
    when(cartItemRepository.save(any(CartItem.class))).thenAnswer(inv -> {
      CartItem saved = inv.getArgument(0);
      saved.setId("cart-new");
      saved.setCreatedAt(LocalDateTime.of(2026, 6, 5, 10, 0));
      return saved;
    });
    when(listingService.getListingVariantContext("variant-1")).thenReturn(sampleContext());

    CartItemAddRequest request = CartItemAddRequest.builder()
        .listingId("listing-1")
        .listingVariantId("variant-1")
        .quantity(2)
        .mode(CartMode.BUY)
        .build();

    CartItemResponse result = cartService.addCartItem("profile-1", request);

    ArgumentCaptor<CartItem> captor = ArgumentCaptor.forClass(CartItem.class);
    verify(cartItemRepository).save(captor.capture());
    assertThat(captor.getValue().getProfileId()).isEqualTo("profile-1");
    assertThat(captor.getValue().getQuantity()).isEqualTo(2);
    assertThat(captor.getValue().getMode()).isEqualTo(CartMode.BUY);
    assertThat(result.getId()).isEqualTo("cart-new");
    assertThat(result.getQuantity()).isEqualTo(2);
  }

  @Test
  void addCartItem_rent_requiresRentalDates() {
    ListingVariant variant = activeRentVariant();
    when(listingVariantRepository.findById("variant-1")).thenReturn(Optional.of(variant));
    when(listingVariantRepository.existsByIdAndListing_Id("variant-1", "listing-1")).thenReturn(true);

    CartItemAddRequest request = CartItemAddRequest.builder()
        .listingId("listing-1")
        .listingVariantId("variant-1")
        .quantity(1)
        .mode(CartMode.RENT)
        .build();

    assertThatThrownBy(() -> cartService.addCartItem("profile-1", request))
        .isInstanceOf(AppException.class)
        .extracting(ex -> ((AppException) ex).getErrorCode())
        .isEqualTo(ErrorCode.REQUIRED_FIELD);

    verify(cartItemRepository, never()).save(any());
  }

  @Test
  void updateCartItem_updatesQuantity() {
    CartItem item = activeBuyCartItem();
    when(cartItemRepository.findByIdAndProfileIdAndDeletedAtIsNull("cart-1", "profile-1"))
        .thenReturn(Optional.of(item));
    when(listingVariantRepository.findById("variant-1")).thenReturn(Optional.of(activeBuyVariant()));
    when(listingVariantRepository.existsByIdAndListing_Id("variant-1", "listing-1")).thenReturn(true);
    when(cartItemRepository.save(item)).thenReturn(item);
    when(listingService.getListingVariantContext("variant-1")).thenReturn(sampleContext());

    CartItemResponse result = cartService.updateCartItem(
        "profile-1",
        "cart-1",
        CartItemUpdateRequest.builder().quantity(5).build());

    assertThat(item.getQuantity()).isEqualTo(5);
    assertThat(result.getQuantity()).isEqualTo(5);
  }

  @Test
  void removeCartItem_deletesOwnedItem() {
    CartItem item = activeBuyCartItem();
    when(cartItemRepository.findByIdAndProfileIdAndDeletedAtIsNull("cart-1", "profile-1"))
        .thenReturn(Optional.of(item));

    cartService.removeCartItem("profile-1", "cart-1");

    verify(cartItemRepository).delete(item);
  }

  @Test
  void removeCartItem_notFound_throws() {
    when(cartItemRepository.findByIdAndProfileIdAndDeletedAtIsNull("missing", "profile-1"))
        .thenReturn(Optional.empty());

    assertThatThrownBy(() -> cartService.removeCartItem("profile-1", "missing"))
        .isInstanceOf(AppException.class)
        .extracting(ex -> ((AppException) ex).getErrorCode())
        .isEqualTo(ErrorCode.CART_ITEM_NOT_FOUND);
  }

  @Test
  void clearCart_deletesAllItemsForProfile() {
    cartService.clearCart("profile-1");

    verify(cartItemRepository).deleteByProfileIdAndDeletedAtIsNull("profile-1");
  }

  private static CartItem activeBuyCartItem() {
    return CartItem.builder()
        .id("cart-1")
        .profileId("profile-1")
        .listingId("listing-1")
        .listingVariantId("variant-1")
        .quantity(1)
        .mode(CartMode.BUY)
        .build();
  }

  private static ListingVariant activeBuyVariant() {
    Product product = Product.builder()
        .id("product-1")
        .status(ProductStatus.PUBLISHED)
        .build();
    Listing listing = Listing.builder()
        .id("listing-1")
        .listingType(ListingType.BUY)
        .listingStatus(ListingStatus.ACTIVE)
        .product(product)
        .build();
    return ListingVariant.builder()
        .id("variant-1")
        .listing(listing)
        .isActive(true)
        .buyPrice(100_000d)
        .build();
  }

  private static ListingVariant activeRentVariant() {
    Product product = Product.builder()
        .id("product-1")
        .status(ProductStatus.PUBLISHED)
        .build();
    Listing listing = Listing.builder()
        .id("listing-1")
        .listingType(ListingType.RENT)
        .listingStatus(ListingStatus.ACTIVE)
        .product(product)
        .build();
    return ListingVariant.builder()
        .id("variant-1")
        .listing(listing)
        .isActive(true)
        .rentPrice(50_000d)
        .rentUnit(RentUnit.DAY)
        .build();
  }

  private static ListingVariantContextResponse sampleContext() {
    return ListingVariantContextResponse.builder()
        .listingId("listing-1")
        .listingVariantId("variant-1")
        .title("Listing title")
        .productName("Product name")
        .facilityId("facility-1")
        .listingType(ListingType.BUY)
        .buyPrice(100_000d)
        .build();
  }
}
