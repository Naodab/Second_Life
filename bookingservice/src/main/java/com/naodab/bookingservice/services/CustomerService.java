package com.naodab.bookingservice.services;

import java.util.List;

import com.naodab.bookingservice.dto.request.CustomerUpsertRequest;
import com.naodab.bookingservice.dto.response.BookingOrderCustomerResponse;
import com.naodab.bookingservice.models.Customer;

public interface CustomerService {

  List<BookingOrderCustomerResponse> listCustomers(String profileId);

  BookingOrderCustomerResponse createCustomer(String profileId, CustomerUpsertRequest request);

  BookingOrderCustomerResponse updateCustomer(String profileId, String customerId, CustomerUpsertRequest request);

  BookingOrderCustomerResponse setDefaultCustomer(String profileId, String customerId);

  BookingOrderCustomerResponse getCustomerForProfile(String profileId, String customerId);

  Customer getOwnedCustomerEntity(String profileId, String customerId);
}
