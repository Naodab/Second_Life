package com.naodab.bookingservice.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.time.Month;
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
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.naodab.bookingservice.dto.request.RentalOrderCreateRequest;
import com.naodab.bookingservice.dto.request.RentalOrderStatusUpdateRequest;
import com.naodab.bookingservice.dto.response.RentalOrderResponse;
import com.naodab.bookingservice.models.enums.RentalOrderStatus;
import com.naodab.bookingservice.services.RentalOrderAdminService;
import com.naodab.bookingservice.services.RentalOrderService;
import com.naodab.commonservice.response.PagedItemsResponse;
import com.naodab.commonservice.constant.AppConstants;
import com.naodab.commonservice.exception.GlobalExceptionHandler;

@ExtendWith(MockitoExtension.class)
class RentalOrderControllerTest {

  private static final String PROFILE_ID = "profile-1";
  private static final String ORDER_ID = "order-1";
  private static final String LISTING_VARIANT_ID = "variant-1";
  private static final String CUSTOMER_ID = "customer-1";
  private static final LocalDateTime START_TIME = LocalDateTime.of(2026, Month.JULY, 1, 10, 0, 0);
  private static final LocalDateTime END_TIME = LocalDateTime.of(2026, Month.JULY, 3, 10, 0, 0);

  @Mock
  RentalOrderService rentalOrderService;

  @Mock
  RentalOrderAdminService rentalOrderAdminService;

  @InjectMocks
  RentalOrderController rentalOrderController;

  MockMvc mockMvc;
  ObjectMapper objectMapper;

  @BeforeEach
  void setUp() {
    objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
    validator.afterPropertiesSet();
    mockMvc = MockMvcBuilders.standaloneSetup(rentalOrderController)
        .setControllerAdvice(new GlobalExceptionHandler())
        .setValidator(validator)
        .build();
  }

  @Test
  void createRentalOrder_missingProfileHeader_returnsBadRequest() throws Exception {
    mockMvc.perform(post("/rental-orders")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(validCreateRequest())))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value(1000));

    verify(rentalOrderService, never()).createRentalOrder(any(), any());
  }

  @Test
  void createRentalOrder_blankProfileHeader_returnsBadRequest() throws Exception {
    mockMvc.perform(post("/rental-orders")
        .header(AppConstants.HEADER_PROFILE_ID, "   ")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(validCreateRequest())))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value(1000));

    verify(rentalOrderService, never()).createRentalOrder(any(), any());
  }

  @Test
  void createRentalOrder_invalidBody_quantityZero_returnsBadRequest() throws Exception {
    RentalOrderCreateRequest body = validCreateRequest();
    body.setQuantity(0);

    mockMvc.perform(post("/rental-orders")
        .header(AppConstants.HEADER_PROFILE_ID, PROFILE_ID)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value(1063));

    verify(rentalOrderService, never()).createRentalOrder(any(), any());
  }

  @Test
  void createRentalOrder_valid_trimsProfileHeaderAndDelegates() throws Exception {
    RentalOrderCreateRequest body = validCreateRequest();
    RentalOrderResponse response = sampleResponse(RentalOrderStatus.PENDING);
    when(rentalOrderService.createRentalOrder(eq("profile-1"), any(RentalOrderCreateRequest.class)))
        .thenReturn(response);

    mockMvc.perform(post("/rental-orders")
        .header(AppConstants.HEADER_PROFILE_ID, "  profile-1  ")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.id").value(ORDER_ID))
        .andExpect(jsonPath("$.data.listingVariantId").value(LISTING_VARIANT_ID))
        .andExpect(jsonPath("$.data.status").value("PENDING"));

    verify(rentalOrderService).createRentalOrder(eq("profile-1"), any(RentalOrderCreateRequest.class));
  }

  @Test
  void listRentalOrders_missingProfileHeader_returnsBadRequest() throws Exception {
    mockMvc.perform(get("/rental-orders"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value(1000));

    verify(rentalOrderService, never()).listRentalOrders(any());
  }

  @Test
  void listRentalOrders_blankProfileHeader_returnsBadRequest() throws Exception {
    mockMvc.perform(get("/rental-orders")
        .header(AppConstants.HEADER_PROFILE_ID, "   "))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value(1000));

    verify(rentalOrderService, never()).listRentalOrders(any());
  }

  @Test
  void listRentalOrders_returnsOrdersForProfile() throws Exception {
    when(rentalOrderService.listRentalOrders(PROFILE_ID))
        .thenReturn(List.of(sampleResponse(RentalOrderStatus.PENDING)));

    mockMvc.perform(get("/rental-orders")
        .header(AppConstants.HEADER_PROFILE_ID, PROFILE_ID))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[0].id").value(ORDER_ID))
        .andExpect(jsonPath("$.data[0].listingVariantId").value(LISTING_VARIANT_ID))
        .andExpect(jsonPath("$.data[0].customerId").value(CUSTOMER_ID))
        .andExpect(jsonPath("$.data[0].status").value("PENDING"));

    verify(rentalOrderService).listRentalOrders(PROFILE_ID);
  }

  @Test
  void listRentalOrders_returnsEmptyList() throws Exception {
    when(rentalOrderService.listRentalOrders(PROFILE_ID)).thenReturn(List.of());

    mockMvc.perform(get("/rental-orders")
        .header(AppConstants.HEADER_PROFILE_ID, PROFILE_ID))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data").isArray())
        .andExpect(jsonPath("$.data").isEmpty());

    verify(rentalOrderService).listRentalOrders(PROFILE_ID);
  }

  @Test
  void listRentalOrders_trimsProfileHeader_andReturnsOrderFields() throws Exception {
    RentalOrderResponse response = RentalOrderResponse.builder()
        .id(ORDER_ID)
        .customerId(CUSTOMER_ID)
        .listingVariantId(LISTING_VARIANT_ID)
        .quantity(2)
        .price(200_000L)
        .startTime(START_TIME)
        .endTime(END_TIME)
        .status(RentalOrderStatus.CONFIRMED)
        .createdAt(LocalDateTime.of(2026, Month.MAY, 1, 9, 0, 0))
        .build();
    when(rentalOrderService.listRentalOrders("profile-1")).thenReturn(List.of(response));

    mockMvc.perform(get("/rental-orders")
        .header(AppConstants.HEADER_PROFILE_ID, "  profile-1  "))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[0].id").value(ORDER_ID))
        .andExpect(jsonPath("$.data[0].customerId").value(CUSTOMER_ID))
        .andExpect(jsonPath("$.data[0].quantity").value(2))
        .andExpect(jsonPath("$.data[0].price").value(200_000))
        .andExpect(jsonPath("$.data[0].status").value("CONFIRMED"))
        .andExpect(jsonPath("$.data[0].createdAt").exists());

    verify(rentalOrderService).listRentalOrders("profile-1");
  }

  @Test
  void listFacilityRentalOrders_missingProfileHeader_returnsBadRequest() throws Exception {
    mockMvc.perform(get("/rental-orders/by-facility/{facilityId}", "facility-1"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value(1000));

    verify(rentalOrderService, never()).listFacilityRentalOrders(any(), any());
  }

  @Test
  void listFacilityRentalOrders_returnsOrders() throws Exception {
    when(rentalOrderService.listFacilityRentalOrders(PROFILE_ID, "facility-1"))
        .thenReturn(List.of(sampleResponse(RentalOrderStatus.PENDING)));

    mockMvc.perform(get("/rental-orders/by-facility/{facilityId}", "facility-1")
        .header(AppConstants.HEADER_PROFILE_ID, PROFILE_ID))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[0].id").value(ORDER_ID));

    verify(rentalOrderService).listFacilityRentalOrders(PROFILE_ID, "facility-1");
  }

  @Test
  void listFacilityRentalOrders_returnsEmptyList() throws Exception {
    when(rentalOrderService.listFacilityRentalOrders(PROFILE_ID, "facility-1")).thenReturn(List.of());

    mockMvc.perform(get("/rental-orders/by-facility/{facilityId}", "facility-1")
        .header(AppConstants.HEADER_PROFILE_ID, PROFILE_ID))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data").isArray())
        .andExpect(jsonPath("$.data").isEmpty());

    verify(rentalOrderService).listFacilityRentalOrders(PROFILE_ID, "facility-1");
  }

  @Test
  void updateRentalOrderStatus_missingProfileHeader_returnsBadRequest() throws Exception {
    RentalOrderStatusUpdateRequest body = RentalOrderStatusUpdateRequest.builder()
        .status(RentalOrderStatus.CONFIRMED)
        .build();

    mockMvc.perform(patch("/rental-orders/{id}/status", ORDER_ID)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value(1000));

    verify(rentalOrderService, never()).updateRentalOrderStatus(any(), any(), any());
  }

  @Test
  void updateRentalOrderStatus_returnsUpdatedOrder() throws Exception {
    RentalOrderStatusUpdateRequest body = RentalOrderStatusUpdateRequest.builder()
        .status(RentalOrderStatus.CONFIRMED)
        .build();
    when(rentalOrderService.updateRentalOrderStatus(
        eq(PROFILE_ID), eq(ORDER_ID), any(RentalOrderStatusUpdateRequest.class)))
        .thenReturn(sampleResponse(RentalOrderStatus.CONFIRMED));

    mockMvc.perform(patch("/rental-orders/{id}/status", ORDER_ID)
        .header(AppConstants.HEADER_PROFILE_ID, PROFILE_ID)
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.id").value(ORDER_ID))
        .andExpect(jsonPath("$.data.status").value("CONFIRMED"));

    verify(rentalOrderService).updateRentalOrderStatus(
        eq(PROFILE_ID), eq(ORDER_ID), any(RentalOrderStatusUpdateRequest.class));
  }

  @Test
  void cancelRentalOrder_missingProfileHeader_returnsBadRequest() throws Exception {
    mockMvc.perform(delete("/rental-orders/{id}", ORDER_ID))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value(1000));

    verify(rentalOrderService, never()).cancelRentalOrder(any(), any());
  }

  @Test
  void cancelRentalOrder_returnsNoContent() throws Exception {
    mockMvc.perform(delete("/rental-orders/{id}", ORDER_ID)
        .header(AppConstants.HEADER_PROFILE_ID, PROFILE_ID))
        .andExpect(status().isNoContent());

    verify(rentalOrderService).cancelRentalOrder(PROFILE_ID, ORDER_ID);
  }

  @Test
  void listRentalOrdersAdmin_requiresAdmin() throws Exception {
    mockMvc.perform(get("/rental-orders/admin")
        .header(AppConstants.JWT_CLAIM_ROLE, "USER"))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value(1050));

    verify(rentalOrderAdminService, never()).listOrders(any(), any(), any(), any(), any());
  }

  @Test
  void listRentalOrdersAdmin_adminOk() throws Exception {
    when(rentalOrderAdminService.listOrders(0, 20, null, null, null))
        .thenReturn(PagedItemsResponse.<RentalOrderResponse>builder()
            .page(0)
            .pageSize(20)
            .totalCount(1)
            .items(List.of(sampleResponse(RentalOrderStatus.PENDING)))
            .build());

    mockMvc.perform(get("/rental-orders/admin")
        .header(AppConstants.JWT_CLAIM_ROLE, AppConstants.ROLE_ADMIN)
        .param("page", "0")
        .param("pageSize", "20"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.totalCount").value(1))
        .andExpect(jsonPath("$.data.items[0].id").value(ORDER_ID));

    verify(rentalOrderAdminService).listOrders(0, 20, null, null, null);
  }

  private static RentalOrderCreateRequest validCreateRequest() {
    return RentalOrderCreateRequest.builder()
        .listingVariantId(LISTING_VARIANT_ID)
        .customerId(CUSTOMER_ID)
        .startTime(START_TIME)
        .endTime(END_TIME)
        .quantity(1)
        .build();
  }

  private static RentalOrderResponse sampleResponse(RentalOrderStatus status) {
    return RentalOrderResponse.builder()
        .id(ORDER_ID)
        .customerId(CUSTOMER_ID)
        .listingVariantId(LISTING_VARIANT_ID)
        .quantity(1)
        .startTime(START_TIME)
        .endTime(END_TIME)
        .status(status)
        .build();
  }
}
