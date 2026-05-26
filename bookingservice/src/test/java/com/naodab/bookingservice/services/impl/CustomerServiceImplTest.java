package com.naodab.bookingservice.services.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.naodab.bookingservice.clients.LocationClients;
import com.naodab.bookingservice.clients.LocationClients.LocationLabels;
import com.naodab.bookingservice.dto.request.BookingOrderCustomerRequest;
import com.naodab.bookingservice.dto.request.CustomerUpsertRequest;
import com.naodab.bookingservice.dto.response.BookingOrderCustomerResponse;
import com.naodab.bookingservice.mappers.CustomerMapper;
import com.naodab.bookingservice.models.Customer;
import com.naodab.bookingservice.repositories.CustomerRepository;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;

@ExtendWith(MockitoExtension.class)
class CustomerServiceImplTest {

  private static final String PROFILE_ID = "profile-1";
  private static final String CUSTOMER_ID = "customer-1";
  private static final String OTHER_CUSTOMER_ID = "customer-2";

  @Mock
  CustomerRepository customerRepository;

  @Mock
  LocationClients locationClients;

  CustomerMapper customerMapper;
  CustomerServiceImpl customerService;

  @BeforeEach
  void setUp() {
    lenient()
        .when(locationClients.resolveLabels(anyString(), anyString()))
        .thenReturn(new LocationLabels("Ho Chi Minh", "Ben Nghe"));
    customerMapper = new CustomerMapper(locationClients);
    customerService = new CustomerServiceImpl(customerRepository, customerMapper, locationClients);
  }

  @Test
  void listCustomers_returnsMappedResponsesInRepositoryOrder() {
    Customer first = sampleCustomer(CUSTOMER_ID, true);
    Customer second = sampleCustomer(OTHER_CUSTOMER_ID, false);
    when(customerRepository.findByProfileIdAndDeletedAtIsNullOrderByIsDefaultDescUpdatedAtDesc(PROFILE_ID))
        .thenReturn(List.of(first, second));

    List<BookingOrderCustomerResponse> responses = customerService.listCustomers(PROFILE_ID);

    assertThat(responses).hasSize(2);
    assertThat(responses.get(0).getId()).isEqualTo(CUSTOMER_ID);
    assertThat(responses.get(0).isDefaultCustomer()).isTrue();
    assertThat(responses.get(1).getId()).isEqualTo(OTHER_CUSTOMER_ID);
    assertThat(responses.get(1).getProvinceName()).isEqualTo("Ho Chi Minh");
  }

  @Test
  void createCustomer_firstForProfile_becomesDefaultWithoutSetAsDefault() {
    CustomerUpsertRequest request = upsertRequest(false);
    when(customerRepository.countByProfileIdAndDeletedAtIsNull(PROFILE_ID)).thenReturn(0L);
    when(customerRepository.findByProfileIdAndDeletedAtIsNullOrderByIsDefaultDescUpdatedAtDesc(PROFILE_ID))
        .thenReturn(List.of());
    when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));

    BookingOrderCustomerResponse response = customerService.createCustomer(PROFILE_ID, request);

    assertThat(response.isDefaultCustomer()).isTrue();
    verify(locationClients).assertProvinceWardValid("79", "26734");

    ArgumentCaptor<Customer> captor = ArgumentCaptor.forClass(Customer.class);
    verify(customerRepository).save(captor.capture());
    Customer saved = captor.getValue();
    assertThat(saved.getProfileId()).isEqualTo(PROFILE_ID);
    assertThat(saved.getId()).isNotBlank();
    assertThat(saved.isDefault()).isTrue();
  }

  @Test
  void createCustomer_setAsDefault_clearsExistingDefault() {
    Customer existingDefault = sampleCustomer(OTHER_CUSTOMER_ID, true);
    CustomerUpsertRequest request = upsertRequest(true);
    when(customerRepository.findByProfileIdAndDeletedAtIsNullOrderByIsDefaultDescUpdatedAtDesc(PROFILE_ID))
        .thenReturn(List.of(existingDefault));
    when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));

    BookingOrderCustomerResponse response = customerService.createCustomer(PROFILE_ID, request);

    assertThat(response.isDefaultCustomer()).isTrue();
    assertThat(existingDefault.isDefault()).isFalse();
    verify(customerRepository).save(existingDefault);
  }

  @Test
  void createCustomer_notFirstAndNotSetAsDefault_staysNonDefault() {
    CustomerUpsertRequest request = upsertRequest(false);
    when(customerRepository.countByProfileIdAndDeletedAtIsNull(PROFILE_ID)).thenReturn(2L);
    when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));

    BookingOrderCustomerResponse response = customerService.createCustomer(PROFILE_ID, request);

    assertThat(response.isDefaultCustomer()).isFalse();
    verify(customerRepository, never()).findByProfileIdAndDeletedAtIsNullOrderByIsDefaultDescUpdatedAtDesc(PROFILE_ID);
  }

  @Test
  void createCustomer_invalidLocation_propagatesException() {
    CustomerUpsertRequest request = upsertRequest(false);
    doThrow(new AppException(ErrorCode.WARD_NOT_FOUND))
        .when(locationClients)
        .assertProvinceWardValid("79", "26734");

    assertThatThrownBy(() -> customerService.createCustomer(PROFILE_ID, request))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.WARD_NOT_FOUND);

    verify(customerRepository, never()).save(any());
  }

  @Test
  void updateCustomer_appliesFieldsAndReturnsResponse() {
    Customer customer = sampleCustomer(CUSTOMER_ID, false);
    CustomerUpsertRequest request = CustomerUpsertRequest.builder()
        .customer(BookingOrderCustomerRequest.builder()
            .firstName("Binh")
            .lastName("Tran")
            .phoneNumber("0909999999")
            .email("binh@example.com")
            .address("456 Duong XYZ")
            .provinceCode("79")
            .wardCode("26734")
            .build())
        .setAsDefault(false)
        .build();
    when(customerRepository.findByIdAndProfileIdAndDeletedAtIsNull(CUSTOMER_ID, PROFILE_ID))
        .thenReturn(Optional.of(customer));
    when(customerRepository.save(customer)).thenReturn(customer);

    BookingOrderCustomerResponse response = customerService.updateCustomer(PROFILE_ID, CUSTOMER_ID, request);

    assertThat(response.getFirstName()).isEqualTo("Binh");
    assertThat(response.getEmail()).isEqualTo("binh@example.com");
    assertThat(customer.getLastName()).isEqualTo("Tran");
    verify(locationClients).assertProvinceWardValid("79", "26734");
  }

  @Test
  void updateCustomer_setAsDefault_clearsOtherDefaults() {
    Customer customer = sampleCustomer(CUSTOMER_ID, false);
    Customer otherDefault = sampleCustomer(OTHER_CUSTOMER_ID, true);
    CustomerUpsertRequest request = upsertRequest(true);
    when(customerRepository.findByIdAndProfileIdAndDeletedAtIsNull(CUSTOMER_ID, PROFILE_ID))
        .thenReturn(Optional.of(customer));
    when(customerRepository.findByProfileIdAndDeletedAtIsNullOrderByIsDefaultDescUpdatedAtDesc(PROFILE_ID))
        .thenReturn(List.of(otherDefault, customer));
    when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));

    BookingOrderCustomerResponse response = customerService.updateCustomer(PROFILE_ID, CUSTOMER_ID, request);

    assertThat(response.isDefaultCustomer()).isTrue();
    assertThat(otherDefault.isDefault()).isFalse();
    verify(customerRepository).save(otherDefault);
  }

  @Test
  void updateCustomer_notFound_throws() {
    when(customerRepository.findByIdAndProfileIdAndDeletedAtIsNull(CUSTOMER_ID, PROFILE_ID))
        .thenReturn(Optional.empty());

    assertThatThrownBy(() -> customerService.updateCustomer(PROFILE_ID, CUSTOMER_ID, upsertRequest(false)))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CUSTOMER_NOT_FOUND);
  }

  @Test
  void setDefaultCustomer_clearsOthersAndMarksTarget() {
    Customer customer = sampleCustomer(CUSTOMER_ID, false);
    Customer otherDefault = sampleCustomer(OTHER_CUSTOMER_ID, true);
    when(customerRepository.findByIdAndProfileIdAndDeletedAtIsNull(CUSTOMER_ID, PROFILE_ID))
        .thenReturn(Optional.of(customer));
    when(customerRepository.findByProfileIdAndDeletedAtIsNullOrderByIsDefaultDescUpdatedAtDesc(PROFILE_ID))
        .thenReturn(List.of(otherDefault, customer));
    when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));

    BookingOrderCustomerResponse response = customerService.setDefaultCustomer(PROFILE_ID, CUSTOMER_ID);

    assertThat(response.isDefaultCustomer()).isTrue();
    assertThat(otherDefault.isDefault()).isFalse();
    verify(customerRepository).save(otherDefault);
    verify(customerRepository).save(customer);
  }

  @Test
  void getCustomerForProfile_returnsMappedCustomer() {
    Customer customer = sampleCustomer(CUSTOMER_ID, true);
    when(customerRepository.findByIdAndProfileIdAndDeletedAtIsNull(CUSTOMER_ID, PROFILE_ID))
        .thenReturn(Optional.of(customer));

    BookingOrderCustomerResponse response = customerService.getCustomerForProfile(PROFILE_ID, CUSTOMER_ID);

    assertThat(response.getId()).isEqualTo(CUSTOMER_ID);
    assertThat(response.getProfileId()).isEqualTo(PROFILE_ID);
    assertThat(response.getWardName()).isEqualTo("Ben Nghe");
  }

  @Test
  void getOwnedCustomerEntity_notFound_throws() {
    when(customerRepository.findByIdAndProfileIdAndDeletedAtIsNull(eq("missing"), eq(PROFILE_ID)))
        .thenReturn(Optional.empty());

    assertThatThrownBy(() -> customerService.getOwnedCustomerEntity(PROFILE_ID, "missing"))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CUSTOMER_NOT_FOUND);
  }

  private static Customer sampleCustomer(String id, boolean isDefault) {
    return Customer.builder()
        .id(id)
        .profileId(PROFILE_ID)
        .firstName("An")
        .lastName("Nguyen")
        .phoneNumber("0901234567")
        .email("an@example.com")
        .address("123 Duong ABC")
        .provinceCode("79")
        .wardCode("26734")
        .isDefault(isDefault)
        .build();
  }

  private static CustomerUpsertRequest upsertRequest(boolean setAsDefault) {
    return CustomerUpsertRequest.builder()
        .customer(BookingOrderCustomerRequest.builder()
            .firstName("An")
            .lastName("Nguyen")
            .phoneNumber("0901234567")
            .email("an@example.com")
            .address("123 Duong ABC")
            .provinceCode("79")
            .wardCode("26734")
            .build())
        .setAsDefault(setAsDefault)
        .build();
  }
}
