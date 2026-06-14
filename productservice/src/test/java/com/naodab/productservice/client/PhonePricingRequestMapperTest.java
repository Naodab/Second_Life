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

    assertThat(payload.get("subCategoryId")).isEqualTo("sub-phone");
    assertThat(payload.get("brand")).isEqualTo("Apple");
    assertThat(payload.get("storageGb")).isEqualTo(128.0);
    assertThat(payload.get("ramGb")).isEqualTo(6.0);
    assertThat(payload.get("condition")).isEqualTo("Good");
    assertThat(payload.get("simLock")).isEqualTo("International");
    assertThat(payload.get("screenInches")).isEqualTo(6.1);
    assertThat(payload.get("manufactureYear")).isEqualTo(2022);
    assertThat(payload.get("regionName")).isEqualTo("Tp Hồ Chí Minh");
    assertThat(payload.get("description").toString()).contains("pin 95%");
  }
}
