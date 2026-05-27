package com.naodab.bookingservice.services;

import java.util.List;

import com.naodab.bookingservice.dto.request.RentalOrderCreateRequest;
import com.naodab.bookingservice.dto.request.RentalOrderStatusUpdateRequest;
import com.naodab.bookingservice.dto.response.RentalOrderResponse;

public interface RentalOrderService {

  RentalOrderResponse createRentalOrder(String profileId, RentalOrderCreateRequest request);

  List<RentalOrderResponse> listRentalOrders(String profileId);

  List<RentalOrderResponse> listFacilityRentalOrders(String profileId, String facilityId);

  RentalOrderResponse updateRentalOrderStatus(String profileId, String id, RentalOrderStatusUpdateRequest request);

  void cancelRentalOrder(String profileId, String id);
}
