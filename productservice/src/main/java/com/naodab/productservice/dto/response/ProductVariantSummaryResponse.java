package com.naodab.productservice.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class ProductVariantSummaryResponse {

  String id;

  String sku;

  Long quantity;

  String label;

  /** Must match PUT body when merging existing variants without changing SKU. */
  List<String> attributeValueIds;
}
