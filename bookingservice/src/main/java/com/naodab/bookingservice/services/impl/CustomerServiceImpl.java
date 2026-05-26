package com.naodab.bookingservice.services.impl;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.naodab.bookingservice.clients.LocationClients;
import com.naodab.bookingservice.dto.request.CustomerUpsertRequest;
import com.naodab.bookingservice.dto.response.BookingOrderCustomerResponse;
import com.naodab.bookingservice.mappers.CustomerMapper;
import com.naodab.bookingservice.models.Customer;
import com.naodab.bookingservice.repositories.CustomerRepository;
import com.naodab.bookingservice.services.CustomerService;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CustomerServiceImpl implements CustomerService {

  CustomerRepository customerRepository;
  CustomerMapper customerMapper;
  LocationClients locationClients;

  @Override
  @Transactional(readOnly = true)
  public List<BookingOrderCustomerResponse> listCustomers(String profileId) {
    return customerRepository.findByProfileIdAndDeletedAtIsNullOrderByIsDefaultDescUpdatedAtDesc(profileId).stream()
        .map(customerMapper::toResponse)
        .toList();
  }

  @Override
  @Transactional
  public BookingOrderCustomerResponse createCustomer(String profileId, CustomerUpsertRequest request) {
    var body = request.getCustomer();
    log.info(
        "createCustomer profileId={} provinceCode={} wardCode={} setAsDefault={}",
        profileId,
        body.getProvinceCode(),
        body.getWardCode(),
        request.getSetAsDefault());
    try {
      locationClients.assertProvinceWardValid(body.getProvinceCode(), body.getWardCode());
      Customer customer = customerMapper.toCustomer(profileId, body);
      customer.setId(UUID.randomUUID().toString());

      boolean makeDefault = Boolean.TRUE.equals(request.getSetAsDefault())
          || customerRepository.countByProfileIdAndDeletedAtIsNull(profileId) == 0;
      if (makeDefault) {
        clearDefaultForProfile(profileId);
        customer.setDefault(true);
      }

      Customer saved = customerRepository.save(customer);
      log.info("createCustomer saved id={} profileId={} isDefault={}", saved.getId(), profileId, saved.isDefault());
      return customerMapper.toResponse(saved);
    } catch (RuntimeException e) {
      log.error(
          "createCustomer failed profileId={} provinceCode={} wardCode={}: {}",
          profileId,
          body.getProvinceCode(),
          body.getWardCode(),
          e.getMessage(),
          e);
      throw e;
    }
  }

  @Override
  @Transactional
  public BookingOrderCustomerResponse updateCustomer(String profileId, String customerId, CustomerUpsertRequest request) {
    locationClients.assertProvinceWardValid(
        request.getCustomer().getProvinceCode(), request.getCustomer().getWardCode());
    Customer customer = requireOwnedCustomer(profileId, customerId);
    customerMapper.applyUpdate(customer, request.getCustomer());

    if (Boolean.TRUE.equals(request.getSetAsDefault())) {
      clearDefaultForProfile(profileId);
      customer.setDefault(true);
    }

    return customerMapper.toResponse(customerRepository.save(customer));
  }

  @Override
  @Transactional
  public BookingOrderCustomerResponse setDefaultCustomer(String profileId, String customerId) {
    Customer customer = requireOwnedCustomer(profileId, customerId);
    clearDefaultForProfile(profileId);
    customer.setDefault(true);
    return customerMapper.toResponse(customerRepository.save(customer));
  }

  @Override
  @Transactional(readOnly = true)
  public BookingOrderCustomerResponse getCustomerForProfile(String profileId, String customerId) {
    return customerMapper.toResponse(requireOwnedCustomer(profileId, customerId));
  }

  @Override
  @Transactional(readOnly = true)
  public Customer getOwnedCustomerEntity(String profileId, String customerId) {
    return requireOwnedCustomer(profileId, customerId);
  }

  private Customer requireOwnedCustomer(String profileId, String customerId) {
    return customerRepository.findByIdAndProfileIdAndDeletedAtIsNull(customerId, profileId)
        .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));
  }

  private void clearDefaultForProfile(String profileId) {
    for (Customer existing : customerRepository.findByProfileIdAndDeletedAtIsNullOrderByIsDefaultDescUpdatedAtDesc(profileId)) {
      if (existing.isDefault()) {
        existing.setDefault(false);
        customerRepository.save(existing);
      }
    }
  }
}
