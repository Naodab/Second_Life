package com.naodab.bookingservice.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;

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
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.naodab.bookingservice.dto.request.BookingOrderCreateRequest;
import com.naodab.bookingservice.dto.response.BookingOrderResponse;
import com.naodab.bookingservice.models.enums.BookingOrderStatus;
import com.naodab.bookingservice.services.BookingOrderService;
import com.naodab.commonservice.constant.AppConstants;
import com.naodab.commonservice.exception.GlobalExceptionHandler;

@ExtendWith(MockitoExtension.class)
class BookingOrderControllerTest {

  private static final String PROFILE_ID = "profile-1";
  private static final String ORDER_ID = "order-1";
  private static final String LISTING_VARIANT_ID = "variant-1";
  private static final String CUSTOMER_ID = "customer-1";

  @Mock
  BookingOrderService bookingOrderService;

  @InjectMocks
  BookingOrderController bookingOrderController;

  MockMvc mockMvc;
  ObjectMapper objectMapper;

  @BeforeEach
  void setUp() {
    objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
    validator.afterPropertiesSet();
    mockMvc = MockMvcBuilders.standaloneSetup(bookingOrderController)
        .setControllerAdvice(new GlobalExceptionHandler())
        .setValidator(validator)
        .build();
  }

  @Test
  void createBookingOrder_missingProfileHeader_returnsBadRequest() throws Exception {
    mockMvc.perform(post("/orders")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(validCreateRequest())))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value(1000));

    verify(bookingOrderService, never()).createBookingOrder(any(), any());
  }

  @Test
  void createBookingOrder_blankProfileHeader_returnsBadRequest() throws Exception {
    mockMvc.perform(post("/orders")
        .header(AppConstants.HEADER_PROFILE_ID, "   ")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(validCreateRequest())))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value(1000));

    verify(bookingOrderService, never()).createBookingOrder(any(), any());
  }

  @Test
  void createBookingOrder_invalidBody_returnsBadRequest() throws Exception {
    BookingOrderCreateRequest body = validCreateRequest();
    body.setQuantity(0);

    mockMvc.perform(post("/orders")
        .header(AppConstants.HEADER_PROFILE_ID, PROFILE_ID)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value(1063));

    verify(bookingOrderService, never()).createBookingOrder(any(), any());
  }

  @Test
  void createBookingOrder_trimsProfileHeader_andDelegates() throws Exception {
    BookingOrderCreateRequest body = validCreateRequest();
    BookingOrderResponse response = BookingOrderResponse.builder()
        .id(ORDER_ID)
        .customerId(CUSTOMER_ID)
        .listingVariantId(LISTING_VARIANT_ID)
        .quantity(1)
        .pickupTime(body.getPickupTime())
        .status(BookingOrderStatus.PENDING)
        .build();
    when(bookingOrderService.createBookingOrder(eq("profile-1"), any(BookingOrderCreateRequest.class)))
        .thenReturn(response);

    mockMvc.perform(post("/orders")
        .header(AppConstants.HEADER_PROFILE_ID, "  profile-1  ")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(ORDER_ID))
        .andExpect(jsonPath("$.listingVariantId").value(LISTING_VARIANT_ID));

    verify(bookingOrderService).createBookingOrder(eq("profile-1"), any(BookingOrderCreateRequest.class));
  }

  @Test
  void deleteBookingOrder_returnsNoContent() throws Exception {
    mockMvc.perform(delete("/orders/{id}", ORDER_ID))
        .andExpect(status().isNoContent());

    verify(bookingOrderService).deleteBookingOrder(ORDER_ID);
  }

  private static BookingOrderCreateRequest validCreateRequest() {
    return BookingOrderCreateRequest.builder()
        .listingVariantId(LISTING_VARIANT_ID)
        .quantity(1)
        .pickupTime(LocalDateTime.now().plusDays(1))
        .customerId(CUSTOMER_ID)
        .build();
  }
}
