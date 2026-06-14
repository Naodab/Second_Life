package com.naodab.productservice.client;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.naodab.productservice.dto.request.AiSuggestPriceRequest;

class PhonePricingRequestMapperTest {

  @Test
  void isPhoneSubCategory_matchesPrimaryOrList() {
    AiSuggestPriceRequest request = new AiSuggestPriceRequest();
    request.setPrimarySubCategoryId("sub-phone");
    assertThat(PhonePricingRequestMapper.isPhoneSubCategory(request)).isTrue();

    request.setPrimarySubCategoryId(null);
    request.setSubCategoryIds(List.of("sub-other", "sub-phone"));
    assertThat(PhonePricingRequestMapper.isPhoneSubCategory(request)).isTrue();

    request.setSubCategoryIds(List.of("sub-laptop"));
    assertThat(PhonePricingRequestMapper.isPhoneSubCategory(request)).isFalse();
  }

  @Test
  void toPayload_mapsAttributeLinesAndMetadata() {
    AiSuggestPriceRequest request = new AiSuggestPriceRequest();
    request.setProductName("iPhone 13 Pro 128GB");
    request.setListingTitle("iPhone 13 Pro zin");
    request.setListingType("BUY");
    request.setPrimarySubCategoryId("sub-phone");
    request.setManufactureYear(2022);
    request.setRegionName("Tp Hồ Chí Minh");
    request.setAttributeLines(List.of(
        "Brand: Apple",
        "Capacity: 128 GB",
        "RAM: 6 GB",
        "Condition: Good",
        "SIM Lock: Quốc tế",
        "Screen Size: 6.1 inch",
        "Battery Health: 95–100%"));

    Map<String, Object> payload = PhonePricingRequestMapper.toPayload(request);

    assertThat(payload)
        .containsEntry("subCategoryId", "sub-phone")
        .containsEntry("brand", "Apple")
        .containsEntry("storageGb", 128.0)
        .containsEntry("ramGb", 6.0)
        .containsEntry("condition", "Good")
        .containsEntry("simLock", "International")
        .containsEntry("screenInches", 6.1)
        .containsEntry("manufactureYear", 2022)
        .containsEntry("regionName", "Tp Hồ Chí Minh");
    assertThat(payload.get("description").toString()).contains("pin 95%");
  }
}
