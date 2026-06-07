package com.naodab.bookingservice.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
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
import com.naodab.bookingservice.dto.request.BookingOrderStatusUpdateRequest;
import com.naodab.bookingservice.dto.response.BookingOrderResponse;
import com.naodab.bookingservice.models.enums.BookingOrderStatus;
import com.naodab.bookingservice.services.BookingOrderAdminService;
import com.naodab.bookingservice.services.BookingOrderService;
import com.naodab.commonservice.response.PagedItemsResponse;
import com.naodab.commonservice.constant.AppConstants;
import com.naodab.commonservice.exception.GlobalExceptionHandler;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;

@ExtendWith(MockitoExtension.class)
class BookingOrderControllerTest {

  private static final String PROFILE_ID = "profile-1";
  private static final String ORDER_ID = "order-1";
  private static final String LISTING_VARIANT_ID = "variant-1";
  private static final String CUSTOMER_ID = "customer-1";

  @Mock
  BookingOrderService bookingOrderService;

  @Mock
  BookingOrderAdminService bookingOrderAdminService;

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
  void listBookingOrders_missingProfileHeader_returnsBadRequest() throws Exception {
    mockMvc.perform(get("/orders"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value(1000));

    verify(bookingOrderService, never()).listBookingOrders(any());
  }

  @Test
  void listBookingOrders_returnsOrdersForProfile() throws Exception {
    BookingOrderResponse response = BookingOrderResponse.builder()
        .id(ORDER_ID)
        .customerId(CUSTOMER_ID)
        .listingVariantId(LISTING_VARIANT_ID)
        .quantity(1)
        .pickupTime(LocalDateTime.now().plusDays(1))
        .status(BookingOrderStatus.PENDING)
        .build();
    when(bookingOrderService.listBookingOrders(PROFILE_ID)).thenReturn(List.of(response));

    mockMvc.perform(get("/orders")
        .header(AppConstants.HEADER_PROFILE_ID, PROFILE_ID))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[0].id").value(ORDER_ID))
        .andExpect(jsonPath("$.data[0].listingVariantId").value(LISTING_VARIANT_ID));

    verify(bookingOrderService).listBookingOrders(PROFILE_ID);
  }

  @Test
  void cancelBookingOrder_returnsNoContent() throws Exception {
    mockMvc.perform(delete("/orders/{id}", ORDER_ID)
        .header(AppConstants.HEADER_PROFILE_ID, PROFILE_ID))
        .andExpect(status().isNoContent());

    verify(bookingOrderService).cancelBookingOrder(PROFILE_ID, ORDER_ID);
  }

  @Test
  void listBookingOrders_blankProfileHeader_returnsBadRequest() throws Exception {
    mockMvc.perform(get("/orders")
        .header(AppConstants.HEADER_PROFILE_ID, "   "))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value(1000));

    verify(bookingOrderService, never()).listBookingOrders(any());
  }

  @Test
  void listBookingOrders_returnsEmptyList() throws Exception {
    when(bookingOrderService.listBookingOrders(PROFILE_ID)).thenReturn(List.of());

    mockMvc.perform(get("/orders")
        .header(AppConstants.HEADER_PROFILE_ID, PROFILE_ID))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data").isArray())
        .andExpect(jsonPath("$.data").isEmpty());

    verify(bookingOrderService).listBookingOrders(PROFILE_ID);
  }

  @Test
  void listBookingOrders_trimsProfileHeader_andReturnsOrderFields() throws Exception {
    LocalDateTime createdAt = LocalDateTime.of(2026, 5, 1, 9, 30, 0);
    BookingOrderResponse response = BookingOrderResponse.builder()
        .id(ORDER_ID)
        .customerId(CUSTOMER_ID)
        .listingVariantId(LISTING_VARIANT_ID)
        .quantity(2)
        .price(150_000L)
        .pickupTime(LocalDateTime.now().plusDays(3))
        .status(BookingOrderStatus.CONFIRMED)
        .createdAt(createdAt)
        .build();
    when(bookingOrderService.listBookingOrders("profile-1")).thenReturn(List.of(response));

    mockMvc.perform(get("/orders")
        .header(AppConstants.HEADER_PROFILE_ID, "  profile-1  "))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[0].id").value(ORDER_ID))
        .andExpect(jsonPath("$.data[0].customerId").value(CUSTOMER_ID))
        .andExpect(jsonPath("$.data[0].listingVariantId").value(LISTING_VARIANT_ID))
        .andExpect(jsonPath("$.data[0].quantity").value(2))
        .andExpect(jsonPath("$.data[0].price").value(150_000))
        .andExpect(jsonPath("$.data[0].status").value("CONFIRMED"))
        .andExpect(jsonPath("$.data[0].createdAt").exists());

    verify(bookingOrderService).listBookingOrders("profile-1");
  }

  @Test
  void listFacilityOrders_missingProfileHeader_returnsBadRequest() throws Exception {
    mockMvc.perform(get("/orders/by-facility/{facilityId}", "facility-1"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value(1000));

    verify(bookingOrderService, never()).listFacilityOrders(any(), any());
  }

  @Test
  void listFacilityOrders_returnsEmptyList() throws Exception {
    when(bookingOrderService.listFacilityOrders(PROFILE_ID, "facility-1")).thenReturn(List.of());

    mockMvc.perform(get("/orders/by-facility/{facilityId}", "facility-1")
        .header(AppConstants.HEADER_PROFILE_ID, PROFILE_ID))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data").isArray())
        .andExpect(jsonPath("$.data").isEmpty());

    verify(bookingOrderService).listFacilityOrders(PROFILE_ID, "facility-1");
  }

  @Test
  void listFacilityOrders_returnsOrders() throws Exception {
    BookingOrderResponse response = BookingOrderResponse.builder()
        .id(ORDER_ID)
        .customerId(CUSTOMER_ID)
        .listingVariantId(LISTING_VARIANT_ID)
        .quantity(1)
        .pickupTime(LocalDateTime.now().plusDays(1))
        .status(BookingOrderStatus.PENDING)
        .build();
    when(bookingOrderService.listFacilityOrders(PROFILE_ID, "facility-1")).thenReturn(List.of(response));

    mockMvc.perform(get("/orders/by-facility/{facilityId}", "facility-1")
        .header(AppConstants.HEADER_PROFILE_ID, PROFILE_ID))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[0].id").value(ORDER_ID));

    verify(bookingOrderService).listFacilityOrders(PROFILE_ID, "facility-1");
  }

  @Test
  void updateBookingOrderStatus_returnsUpdatedOrder() throws Exception {
    BookingOrderResponse response = BookingOrderResponse.builder()
        .id(ORDER_ID)
        .customerId(CUSTOMER_ID)
        .listingVariantId(LISTING_VARIANT_ID)
        .quantity(1)
        .pickupTime(LocalDateTime.now().plusDays(1))
        .status(BookingOrderStatus.CONFIRMED)
        .build();
    BookingOrderStatusUpdateRequest body = BookingOrderStatusUpdateRequest.builder()
        .status(BookingOrderStatus.CONFIRMED)
        .build();
    when(bookingOrderService.updateBookingOrderStatus(eq(PROFILE_ID), eq(ORDER_ID), any(BookingOrderStatusUpdateRequest.class)))
        .thenReturn(response);

    mockMvc.perform(patch("/orders/{id}/status", ORDER_ID)
        .header(AppConstants.HEADER_PROFILE_ID, PROFILE_ID)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.status").value("CONFIRMED"));

    verify(bookingOrderService).updateBookingOrderStatus(eq(PROFILE_ID), eq(ORDER_ID), any(BookingOrderStatusUpdateRequest.class));
  }

  @Test
  void listBookingOrdersAdmin_requiresAdmin() throws Exception {
    mockMvc.perform(get("/orders/admin")
        .header(AppConstants.JWT_CLAIM_ROLE, "USER"))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value(1050));

    verify(bookingOrderAdminService, never()).listOrders(any(), any(), any(), any(), any());
  }

  @Test
  void listBookingOrdersAdmin_adminOk() throws Exception {
    when(bookingOrderAdminService.listOrders(0, 20, null, null, null))
        .thenReturn(PagedItemsResponse.<BookingOrderResponse>builder()
            .page(0)
            .pageSize(20)
            .totalCount(1)
            .items(List.of(BookingOrderResponse.builder()
                .id(ORDER_ID)
                .customerId(CUSTOMER_ID)
                .listingVariantId(LISTING_VARIANT_ID)
                .quantity(1)
                .status(BookingOrderStatus.PENDING)
                .build()))
            .build());

    mockMvc.perform(get("/orders/admin")
        .header(AppConstants.JWT_CLAIM_ROLE, AppConstants.ROLE_ADMIN)
        .param("page", "0")
        .param("pageSize", "20"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.totalCount").value(1))
        .andExpect(jsonPath("$.data.items[0].id").value(ORDER_ID));

    verify(bookingOrderAdminService).listOrders(0, 20, null, null, null);
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
