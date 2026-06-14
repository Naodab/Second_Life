package com.naodab.productservice.initializers;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.naodab.productservice.models.Attribute;
import com.naodab.productservice.models.AttributeValue;

class AttributeSeedBootstrapTest {

  @Test
  void syncFromSeed_addsSubCategoryIdsAndMissingValues() {
    Attribute existing = Attribute.builder()
        .id("attr-ram")
        .name("RAM")
        .subCategoryIds(new ArrayList<>())
        .attributeValues(new ArrayList<>(List.of(
            AttributeValue.builder().id("val-ram-2gb").value("2 GB").code("2GB").build())))
        .build();

    AttributeSeedBootstrap.AttributeSeed seed = new AttributeSeedBootstrap.AttributeSeed();
    seed.setId("attr-ram");
    seed.setSubCategoryIds(List.of("sub-phone"));
    AttributeSeedBootstrap.AttributeValueSeed valueSeed = new AttributeSeedBootstrap.AttributeValueSeed();
    valueSeed.setId("val-ram-4gb");
    valueSeed.setValue("4 GB");
    valueSeed.setCode("4GB");
    seed.setAttributeValues(List.of(valueSeed));

    assertThat(AttributeSeedBootstrap.syncFromSeed(existing, seed)).isTrue();
    assertThat(existing.getSubCategoryIds()).containsExactly("sub-phone");
    assertThat(existing.getAttributeValues()).hasSize(2);
    assertThat(existing.getAttributeValues()).extracting(AttributeValue::getId)
        .containsExactlyInAnyOrder("val-ram-2gb", "val-ram-4gb");
  }

  @Test
  void syncFromSeed_whenAlreadyUpToDate_returnsFalse() {
    Attribute existing = Attribute.builder()
        .id("attr-ram")
        .name("RAM")
        .subCategoryIds(new ArrayList<>(List.of("sub-phone")))
        .attributeValues(new ArrayList<>(List.of(
            AttributeValue.builder().id("val-ram-4gb").value("4 GB").code("4GB").build())))
        .build();

    AttributeSeedBootstrap.AttributeSeed seed = new AttributeSeedBootstrap.AttributeSeed();
    seed.setId("attr-ram");
    seed.setSubCategoryIds(List.of("sub-phone"));
    AttributeSeedBootstrap.AttributeValueSeed valueSeed = new AttributeSeedBootstrap.AttributeValueSeed();
    valueSeed.setId("val-ram-4gb");
    valueSeed.setValue("4 GB");
    valueSeed.setCode("4GB");
    seed.setAttributeValues(List.of(valueSeed));

    assertThat(AttributeSeedBootstrap.syncFromSeed(existing, seed)).isFalse();
  }

  @Test
  void syncFromSeed_updatesChangedAttributeValue() {
    Attribute existing = Attribute.builder()
        .id("attr-color")
        .name("Color")
        .subCategoryIds(new ArrayList<>())
        .attributeValues(new ArrayList<>(List.of(
            AttributeValue.builder().id("val-red").value("Redd").code("RED").build())))
        .build();

    AttributeSeedBootstrap.AttributeSeed seed = new AttributeSeedBootstrap.AttributeSeed();
    seed.setId("attr-color");
    AttributeSeedBootstrap.AttributeValueSeed valueSeed = new AttributeSeedBootstrap.AttributeValueSeed();
    valueSeed.setId("val-red");
    valueSeed.setValue("Red");
    valueSeed.setCode("RED");
    seed.setAttributeValues(List.of(valueSeed));

    assertThat(AttributeSeedBootstrap.syncFromSeed(existing, seed)).isTrue();
    assertThat(existing.getAttributeValues().get(0).getValue()).isEqualTo("Red");
  }
}
