package com.naodab.bookingservice.mappers;

import org.springframework.stereotype.Component;

import com.naodab.bookingservice.clients.LocationClients;
import com.naodab.bookingservice.clients.LocationClients.LocationLabels;
import com.naodab.bookingservice.dto.request.BookingOrderCustomerRequest;
import com.naodab.bookingservice.dto.response.BookingOrderCustomerResponse;
import com.naodab.bookingservice.models.Customer;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CustomerMapper {

  LocationClients locationClients;

  public Customer toCustomer(String profileId, BookingOrderCustomerRequest request) {
    return Customer.builder()
        .profileId(profileId)
        .firstName(request.getFirstName().trim())
        .lastName(request.getLastName().trim())
        .phoneNumber(request.getPhoneNumber().trim())
        .email(request.getEmail().trim())
        .address(request.getAddress().trim())
        .provinceCode(request.getProvinceCode().trim())
        .wardCode(request.getWardCode().trim())
        .build();
  }

  public BookingOrderCustomerResponse toResponse(Customer customer) {
    LocationLabels labels = locationClients.resolveLabels(customer.getProvinceCode(), customer.getWardCode());
    return BookingOrderCustomerResponse.builder()
        .id(customer.getId())
        .profileId(customer.getProfileId())
        .firstName(customer.getFirstName())
        .lastName(customer.getLastName())
        .phoneNumber(customer.getPhoneNumber())
        .email(customer.getEmail())
        .address(customer.getAddress())
        .provinceCode(customer.getProvinceCode())
        .wardCode(customer.getWardCode())
        .provinceName(labels.provinceName())
        .wardName(labels.wardName())
        .defaultCustomer(customer.isDefault())
        .build();
  }

  public void applyUpdate(Customer customer, BookingOrderCustomerRequest request) {
    customer.setFirstName(request.getFirstName().trim());
    customer.setLastName(request.getLastName().trim());
    customer.setPhoneNumber(request.getPhoneNumber().trim());
    customer.setEmail(request.getEmail().trim());
    customer.setAddress(request.getAddress().trim());
    customer.setProvinceCode(request.getProvinceCode().trim());
    customer.setWardCode(request.getWardCode().trim());
  }
}
