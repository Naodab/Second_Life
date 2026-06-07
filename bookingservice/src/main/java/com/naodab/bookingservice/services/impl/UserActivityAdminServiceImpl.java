package com.naodab.bookingservice.services.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.naodab.bookingservice.clients.ProductClients;
import com.naodab.bookingservice.dto.response.UserOrderActivityCountsResponse;
import com.naodab.bookingservice.repositories.BookingOrderRepository;
import com.naodab.bookingservice.repositories.RentalOrderRepository;
import com.naodab.bookingservice.services.UserActivityAdminService;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserActivityAdminServiceImpl implements UserActivityAdminService {

  BookingOrderRepository bookingOrderRepository;
  RentalOrderRepository rentalOrderRepository;
  ProductClients productClients;

  @Override
  @Transactional(readOnly = true)
  public UserOrderActivityCountsResponse getOrderActivityCounts(String profileId) {
    String normalizedProfileId = requireProfileId(profileId);
    List<String> sellerVariantIds = productClients.listListingVariantIdsForOwnerAdmin(normalizedProfileId);
    long buyOrdersReceived = sellerVariantIds.isEmpty()
        ? 0L
        : bookingOrderRepository.countActiveByListingVariantIdIn(sellerVariantIds);
    long rentOrdersReceived = sellerVariantIds.isEmpty()
        ? 0L
        : rentalOrderRepository.countActiveByListingVariantIdIn(sellerVariantIds);

    return UserOrderActivityCountsResponse.builder()
        .buyOrdersAsBuyer(bookingOrderRepository.countActiveByBuyerProfileId(normalizedProfileId))
        .rentOrdersAsBuyer(rentalOrderRepository.countActiveByBuyerProfileId(normalizedProfileId))
        .buyOrdersReceived(buyOrdersReceived)
        .rentOrdersReceived(rentOrdersReceived)
        .build();
  }

  private static String requireProfileId(String profileId) {
    if (!StringUtils.hasText(profileId)) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    return profileId.trim();
  }
}
