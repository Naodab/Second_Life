package com.naodab.bookingservice.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.naodab.bookingservice.dto.request.BookingOrderCustomerRequest;
import com.naodab.bookingservice.dto.request.CustomerUpsertRequest;
import com.naodab.bookingservice.dto.response.BookingOrderCustomerResponse;
import com.naodab.bookingservice.services.CustomerService;
import com.naodab.commonservice.constant.AppConstants;
import com.naodab.commonservice.exception.GlobalExceptionHandler;

@ExtendWith(MockitoExtension.class)
class CustomerControllerTest {

  private static final String PROFILE_ID = "profile-1";
  private static final String CUSTOMER_ID = "customer-1";

  @Mock
  CustomerService customerService;

  @InjectMocks
  CustomerController customerController;

  MockMvc mockMvc;
  ObjectMapper objectMapper;

  @BeforeEach
  void setUp() {
    objectMapper = new ObjectMapper();
    LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
    validator.afterPropertiesSet();
    mockMvc = MockMvcBuilders.standaloneSetup(customerController)
        .setControllerAdvice(new GlobalExceptionHandler())
        .setValidator(validator)
        .build();
  }

  @Test
  void listCustomers_missingProfileHeader_returnsBadRequest() throws Exception {
    mockMvc.perform(get("/customers"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value(1000));

    verify(customerService, never()).listCustomers(any());
  }

  @Test
  void listCustomers_delegates_andReturnsWrappedList() throws Exception {
    BookingOrderCustomerResponse resp = sampleCustomerResponse();
    when(customerService.listCustomers(PROFILE_ID)).thenReturn(List.of(resp));

    mockMvc.perform(get("/customers")
        .header(AppConstants.HEADER_PROFILE_ID, PROFILE_ID))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[0].id").value(CUSTOMER_ID))
        .andExpect(jsonPath("$.data[0].firstName").value("An"));

    verify(customerService).listCustomers(PROFILE_ID);
  }

  @Test
  void createCustomer_missingProfileHeader_returnsBadRequest() throws Exception {
    mockMvc.perform(post("/customers")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(validUpsertRequest())))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value(1000));

    verify(customerService, never()).createCustomer(any(), any());
  }

  @Test
  void createCustomer_missingCustomerField_returnsBadRequest() throws Exception {
    CustomerUpsertRequest body = CustomerUpsertRequest.builder().build();

    mockMvc.perform(post("/customers")
        .header(AppConstants.HEADER_PROFILE_ID, PROFILE_ID)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value(1062));

    verify(customerService, never()).createCustomer(any(), any());
  }

  @Test
  void createCustomer_invalidEmail_returnsBadRequest() throws Exception {
    CustomerUpsertRequest body = validUpsertRequest();
    body.getCustomer().setEmail("not-an-email");

    mockMvc.perform(post("/customers")
        .header(AppConstants.HEADER_PROFILE_ID, PROFILE_ID)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value(1004));

    verify(customerService, never()).createCustomer(any(), any());
  }

  @Test
  void createCustomer_trimsProfileHeader_andDelegates() throws Exception {
    CustomerUpsertRequest body = validUpsertRequest();
    when(customerService.createCustomer(eq(PROFILE_ID), any(CustomerUpsertRequest.class)))
        .thenReturn(sampleCustomerResponse());

    mockMvc.perform(post("/customers")
        .header(AppConstants.HEADER_PROFILE_ID, "  " + PROFILE_ID + "  ")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.id").value(CUSTOMER_ID));

    verify(customerService).createCustomer(eq(PROFILE_ID), any(CustomerUpsertRequest.class));
  }

  @Test
  void updateCustomer_missingProfileHeader_returnsBadRequest() throws Exception {
    mockMvc.perform(put("/customers/{id}", CUSTOMER_ID)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(validUpsertRequest())))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value(1000));

    verify(customerService, never()).updateCustomer(any(), any(), any());
  }

  @Test
  void updateCustomer_delegates() throws Exception {
    CustomerUpsertRequest body = validUpsertRequest();
    when(customerService.updateCustomer(eq(PROFILE_ID), eq(CUSTOMER_ID), any(CustomerUpsertRequest.class)))
        .thenReturn(sampleCustomerResponse());

    mockMvc.perform(put("/customers/{id}", CUSTOMER_ID)
        .header(AppConstants.HEADER_PROFILE_ID, PROFILE_ID)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.id").value(CUSTOMER_ID));

    verify(customerService).updateCustomer(eq(PROFILE_ID), eq(CUSTOMER_ID), any(CustomerUpsertRequest.class));
  }

  @Test
  void setDefaultCustomer_missingProfileHeader_returnsBadRequest() throws Exception {
    mockMvc.perform(put("/customers/{id}/default", CUSTOMER_ID))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value(1000));

    verify(customerService, never()).setDefaultCustomer(any(), any());
  }

  @Test
  void setDefaultCustomer_delegates() throws Exception {
    when(customerService.setDefaultCustomer(PROFILE_ID, CUSTOMER_ID))
        .thenReturn(sampleCustomerResponse());

    mockMvc.perform(put("/customers/{id}/default", CUSTOMER_ID)
        .header(AppConstants.HEADER_PROFILE_ID, PROFILE_ID))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.id").value(CUSTOMER_ID))
        .andExpect(jsonPath("$.data.isDefault").value(true));

    verify(customerService).setDefaultCustomer(PROFILE_ID, CUSTOMER_ID);
  }

  private static CustomerUpsertRequest validUpsertRequest() {
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
        .setAsDefault(false)
        .build();
  }

  private static BookingOrderCustomerResponse sampleCustomerResponse() {
    return BookingOrderCustomerResponse.builder()
        .id(CUSTOMER_ID)
        .profileId(PROFILE_ID)
        .firstName("An")
        .lastName("Nguyen")
        .phoneNumber("0901234567")
        .email("an@example.com")
        .address("123 Duong ABC")
        .provinceCode("79")
        .wardCode("26734")
        .provinceName("Ho Chi Minh")
        .wardName("Ben Nghe")
        .defaultCustomer(true)
        .build();
  }
}
