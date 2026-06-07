package com.naodab.bookingservice.services;

import com.naodab.bookingservice.dto.response.UserOrderActivityCountsResponse;

public interface UserActivityAdminService {
  UserOrderActivityCountsResponse getOrderActivityCounts(String profileId);
}
