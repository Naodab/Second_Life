package com.naodab.locationservice.controllers;

import static org.hamcrest.Matchers.closeTo;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.naodab.commonservice.exception.GlobalExceptionHandler;
import com.naodab.locationservice.dto.response.CoordinateResolveResponse;
import com.naodab.locationservice.services.WardService;

@WebMvcTest(controllers = WardControlller.class)
@TestPropertySource(properties = "server.servlet.context-path=/")
@Import({ GlobalExceptionHandler.class, WardControlller.class })
class WardControllerTest {

  @Autowired
  MockMvc mockMvc;

  @MockitoBean
  WardService wardService;

  @Test
  void resolveCoordinates_returnsResolvedAdministrativeCodes() throws Exception {
    when(wardService.resolveCoordinates(105.8156951f, 21.0144345f))
        .thenReturn(CoordinateResolveResponse.builder()
            .latitude(21.0144345f)
            .longitude(105.8156951f)
            .wardCode("00167")
            .provinceCode("01")
            .wardName("Phường Thịnh Quang")
            .provinceName("Thành phố Hà Nội")
            .build());

    mockMvc.perform(get("/wards/resolve-coordinates")
            .param("latitude", "21.0144345")
            .param("longitude", "105.8156951"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.latitude").value(closeTo(21.0144345, 0.00001)))
        .andExpect(jsonPath("$.data.longitude").value(closeTo(105.8156951, 0.00001)))
        .andExpect(jsonPath("$.data.wardCode").value("00167"))
        .andExpect(jsonPath("$.data.provinceCode").value("01"))
        .andExpect(jsonPath("$.data.wardName").value("Phường Thịnh Quang"))
        .andExpect(jsonPath("$.data.provinceName").value("Thành phố Hà Nội"));

    verify(wardService).resolveCoordinates(eq(105.8156951f), eq(21.0144345f));
  }

  @Test
  void resolveCoordinates_whenLatitudeMissing_returnsBadRequest() throws Exception {
    mockMvc.perform(get("/wards/resolve-coordinates")
            .param("longitude", "105.8156951"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value(1000))
        .andExpect(jsonPath("$.message").value("latitude and longitude are required"));
  }

  @Test
  void resolveCoordinates_whenLongitudeMissing_returnsBadRequest() throws Exception {
    mockMvc.perform(get("/wards/resolve-coordinates")
            .param("latitude", "21.0144345"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("latitude and longitude are required"));
  }

  @Test
  void getWardsByLonAndLat_whenParamsMissing_returnsBadRequest() throws Exception {
    mockMvc.perform(get("/wards/lon-lat"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("Lon and lat are required"));
  }
}
