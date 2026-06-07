package com.naodab.authservice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class AdminAccountActivitySummaryResponse {
  AdminAccountSellerActivitySummary seller;
  AdminAccountBuyerActivitySummary buyer;
}
