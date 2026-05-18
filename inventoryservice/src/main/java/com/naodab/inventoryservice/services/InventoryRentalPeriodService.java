package com.naodab.inventoryservice.services;

import java.util.List;

import com.naodab.inventoryservice.dto.response.RentalPeriodResponse;

public interface InventoryRentalPeriodService {

  List<RentalPeriodResponse> listBookedRentalPeriods(String listingVariantId);
}
