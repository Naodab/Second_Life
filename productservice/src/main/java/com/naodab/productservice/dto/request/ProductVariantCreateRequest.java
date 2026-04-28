package com.naodab.productservice.dto.request;

import java.util.List;

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
public class ProductVariantCreateRequest {
  @NotNull(message = "REQUIRED_FIELD")
  @PositiveOrZero(message = "INVALID_INPUT")
  Long quantity;

  @NotEmpty(message = "REQUIRED_FIELD")
  List<String> attributeValueIds;
}
