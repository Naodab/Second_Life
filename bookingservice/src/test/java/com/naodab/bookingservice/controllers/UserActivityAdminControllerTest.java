package com.naodab.bookingservice.controllers;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.naodab.bookingservice.dto.response.UserOrderActivityCountsResponse;
import com.naodab.bookingservice.services.UserActivityAdminService;
import com.naodab.commonservice.constant.AppConstants;
import com.naodab.commonservice.exception.GlobalExceptionHandler;

@ExtendWith(MockitoExtension.class)
class UserActivityAdminControllerTest {

  @Mock
  UserActivityAdminService userActivityAdminService;

  @InjectMocks
  UserActivityAdminController userActivityAdminController;

  MockMvc mockMvc;

  @BeforeEach
  void setUp() {
    mockMvc = MockMvcBuilders.standaloneSetup(userActivityAdminController)
        .setControllerAdvice(new GlobalExceptionHandler())
        .build();
  }

  @Test
  void getOrderActivityCounts_requiresAdmin() throws Exception {
    mockMvc.perform(get("/admin/users/profile-1/order-counts")
        .header(AppConstants.JWT_CLAIM_ROLE, "USER"))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value(1050));

    verify(userActivityAdminService, never()).getOrderActivityCounts(org.mockito.ArgumentMatchers.anyString());
  }

  @Test
  void getOrderActivityCounts_adminOk() throws Exception {
    when(userActivityAdminService.getOrderActivityCounts("profile-1"))
        .thenReturn(UserOrderActivityCountsResponse.builder()
            .buyOrdersAsBuyer(2)
            .rentOrdersAsBuyer(1)
            .buyOrdersReceived(5)
            .rentOrdersReceived(3)
            .build());

    mockMvc.perform(get("/admin/users/profile-1/order-counts")
        .header(AppConstants.JWT_CLAIM_ROLE, AppConstants.ROLE_ADMIN))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.buyOrdersAsBuyer").value(2))
        .andExpect(jsonPath("$.data.rentOrdersAsBuyer").value(1))
        .andExpect(jsonPath("$.data.buyOrdersReceived").value(5))
        .andExpect(jsonPath("$.data.rentOrdersReceived").value(3));

    verify(userActivityAdminService).getOrderActivityCounts("profile-1");
  }
}
