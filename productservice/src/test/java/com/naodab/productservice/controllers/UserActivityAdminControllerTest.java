package com.naodab.productservice.controllers;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.naodab.commonservice.constant.AppConstants;
import com.naodab.commonservice.exception.GlobalExceptionHandler;
import com.naodab.productservice.dto.response.UserSellerActivityCountsResponse;
import com.naodab.productservice.services.UserActivityAdminService;

@WebMvcTest(controllers = UserActivityAdminController.class)
@TestPropertySource(properties = "server.servlet.context-path=/")
@Import({ GlobalExceptionHandler.class, UserActivityAdminController.class })
class UserActivityAdminControllerTest {

  @Autowired
  MockMvc mockMvc;

  @MockitoBean
  UserActivityAdminService userActivityAdminService;

  @Test
  void getSellerActivityCounts_requiresAdmin() throws Exception {
    mockMvc.perform(get("/admin/users/profile-1/seller-counts")
        .header(AppConstants.JWT_CLAIM_ROLE, "USER"))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value(1050));

    verify(userActivityAdminService, never()).getSellerActivityCounts(org.mockito.ArgumentMatchers.anyString());
  }

  @Test
  void getSellerActivityCounts_adminOk() throws Exception {
    when(userActivityAdminService.getSellerActivityCounts("profile-1"))
        .thenReturn(UserSellerActivityCountsResponse.builder()
            .facilities(1)
            .products(2)
            .listings(3)
            .build());

    mockMvc.perform(get("/admin/users/profile-1/seller-counts")
        .header(AppConstants.JWT_CLAIM_ROLE, AppConstants.ROLE_ADMIN))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.facilities").value(1))
        .andExpect(jsonPath("$.data.products").value(2))
        .andExpect(jsonPath("$.data.listings").value(3));

    verify(userActivityAdminService).getSellerActivityCounts("profile-1");
  }

  @Test
  void listListingVariantIdsForOwner_adminOk() throws Exception {
    when(userActivityAdminService.listListingVariantIdsForOwner("profile-1"))
        .thenReturn(List.of("variant-1", "variant-2"));

    mockMvc.perform(get("/admin/users/profile-1/listing-variant-ids")
        .header(AppConstants.JWT_CLAIM_ROLE, AppConstants.ROLE_ADMIN))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.length()").value(2))
        .andExpect(jsonPath("$.data[0]").value("variant-1"));

    verify(userActivityAdminService).listListingVariantIdsForOwner("profile-1");
  }
}
