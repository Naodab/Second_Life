package com.naodab.productservice.services.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

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
import com.naodab.productservice.services.CartService;
import com.naodab.productservice.services.ListingService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CartServiceImpl implements CartService {

  CartItemRepository cartItemRepository;
  ListingVariantRepository listingVariantRepository;
  ListingService listingService;

  @Override
  @Transactional(readOnly = true)
  public List<CartItemResponse> listCartItems(String profileId) {
    String normalizedProfileId = requireProfileId(profileId);
    return cartItemRepository.findByProfileIdAndDeletedAtIsNullOrderByCreatedAtDesc(normalizedProfileId)
        .stream()
        .map(this::toResponse)
        .toList();
  }

  @Override
  @Transactional
  public CartItemResponse addCartItem(String profileId, CartItemAddRequest request) {
    String normalizedProfileId = requireProfileId(profileId);
    ListingVariant variant = resolveActiveListingVariant(request.getListingId(), request.getListingVariantId());
    validateAddRequest(request, variant);

    RentUnit rentUnit = request.getRentUnit();
    if (request.getMode() == CartMode.RENT && rentUnit == null) {
      rentUnit = variant.getRentUnit();
    }

    CartItem saved = cartItemRepository.save(CartItem.builder()
        .profileId(normalizedProfileId)
        .listingId(request.getListingId().trim())
        .listingVariantId(request.getListingVariantId().trim())
        .quantity(request.getQuantity())
        .mode(request.getMode())
        .rentalStart(request.getMode() == CartMode.RENT ? request.getRentalStart() : null)
        .rentalEnd(request.getMode() == CartMode.RENT ? request.getRentalEnd() : null)
        .rentUnit(request.getMode() == CartMode.RENT ? rentUnit : null)
        .build());
    return toResponse(saved);
  }

  @Override
  @Transactional
  public CartItemResponse updateCartItem(String profileId, String cartItemId, CartItemUpdateRequest request) {
    String normalizedProfileId = requireProfileId(profileId);
    if (!StringUtils.hasText(cartItemId)) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    if (request == null || request.getQuantity() == null) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    if (request.getQuantity() < 1) {
      throw new AppException(ErrorCode.QUANTITY_MIN);
    }

    CartItem item = cartItemRepository.findByIdAndProfileIdAndDeletedAtIsNull(
            cartItemId.trim(), normalizedProfileId)
        .orElseThrow(() -> new AppException(ErrorCode.CART_ITEM_NOT_FOUND));

    resolveActiveListingVariant(item.getListingId(), item.getListingVariantId());
    item.setQuantity(request.getQuantity());
    return toResponse(cartItemRepository.save(item));
  }

  @Override
  @Transactional
  public void removeCartItem(String profileId, String cartItemId) {
    String normalizedProfileId = requireProfileId(profileId);
    if (!StringUtils.hasText(cartItemId)) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    CartItem item = cartItemRepository.findByIdAndProfileIdAndDeletedAtIsNull(
            cartItemId.trim(), normalizedProfileId)
        .orElseThrow(() -> new AppException(ErrorCode.CART_ITEM_NOT_FOUND));
    cartItemRepository.delete(item);
  }

  @Override
  @Transactional
  public void clearCart(String profileId) {
    String normalizedProfileId = requireProfileId(profileId);
    cartItemRepository.deleteByProfileIdAndDeletedAtIsNull(normalizedProfileId);
  }

  private CartItemResponse toResponse(CartItem item) {
    ListingVariantContextResponse context =
        listingService.getListingVariantContext(item.getListingVariantId());
    return CartItemResponse.builder()
        .id(item.getId())
        .listingId(item.getListingId())
        .listingVariantId(item.getListingVariantId())
        .quantity(item.getQuantity())
        .mode(item.getMode())
        .rentalStart(item.getRentalStart())
        .rentalEnd(item.getRentalEnd())
        .rentUnit(item.getRentUnit())
        .addedAt(item.getCreatedAt())
        .title(context.getTitle())
        .productName(context.getProductName())
        .variantLabel(context.getVariantLabel())
        .thumbnailUrl(context.getThumbnailUrl())
        .facilityId(context.getFacilityId())
        .listingType(context.getListingType())
        .buyPrice(context.getBuyPrice())
        .rentPrice(context.getRentPrice())
        .build();
  }

  private ListingVariant resolveActiveListingVariant(String listingId, String listingVariantId) {
    if (!StringUtils.hasText(listingId) || !StringUtils.hasText(listingVariantId)) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    ListingVariant variant = listingVariantRepository.findById(listingVariantId.trim())
        .orElseThrow(() -> new AppException(ErrorCode.LISTING_VARIANT_NOT_FOUND));
    if (!listingVariantRepository.existsByIdAndListing_Id(variant.getId(), listingId.trim())) {
      throw new AppException(ErrorCode.LISTING_VARIANT_NOT_FOUND);
    }
    if (Boolean.FALSE.equals(variant.getIsActive())) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }

    Listing listing = requireListing(variant);
    Product product = listing.getProduct();
    if (product == null || product.getDeletedAt() != null) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    if (product.getStatus() != ProductStatus.PUBLISHED) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    if (listing.getListingStatus() != ListingStatus.ACTIVE) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    return variant;
  }

  private Listing requireListing(ListingVariant variant) {
    Listing listing = variant.getListing();
    if (listing == null) {
      throw new AppException(ErrorCode.LISTING_VARIANT_NOT_FOUND);
    }
    return listing;
  }

  private void validateAddRequest(CartItemAddRequest request, ListingVariant variant) {
    if (request.getQuantity() == null || request.getQuantity() < 1) {
      throw new AppException(ErrorCode.QUANTITY_MIN);
    }

    Listing listing = requireListing(variant);
    ListingType listingType = listing.getListingType();
    if (request.getMode() == CartMode.BUY) {
      if (listingType != ListingType.BUY) {
        throw new AppException(ErrorCode.INVALID_INPUT);
      }
      if (request.getRentalStart() != null || request.getRentalEnd() != null) {
        throw new AppException(ErrorCode.INVALID_INPUT);
      }
      return;
    }

    if (listingType != ListingType.RENT) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    if (request.getRentalStart() == null || request.getRentalEnd() == null) {
      throw new AppException(ErrorCode.REQUIRED_FIELD);
    }
    if (!request.getRentalEnd().isAfter(request.getRentalStart())) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
  }

  private String requireProfileId(String profileId) {
    if (!StringUtils.hasText(profileId)) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    return profileId.trim();
  }
}
