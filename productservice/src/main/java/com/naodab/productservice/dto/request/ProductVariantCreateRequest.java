package com.naodab.productservice.dto.request;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
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
@JsonIgnoreProperties(ignoreUnknown = true)
public class ProductVariantCreateRequest {
  /** When present, identifies an existing SKU row to merge (preserve id & sku). Omit for newly added variants on update. */
  String id;

  @NotNull(message = "REQUIRED_FIELD")
  @PositiveOrZero(message = "INVALID_INPUT")
  Long quantity;

  @NotEmpty(message = "REQUIRED_FIELD")
  List<String> attributeValueIds;
}
