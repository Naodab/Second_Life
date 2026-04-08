package com.naodab.productservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
public class SubCategoryCreateRequest {
  @NotBlank(message = "REQUIRED_FIELD")
  @Size(min = 3, max = 255, message = "NAME_INVALID")
  String name;

  @Size(max = 1000, message = "DESCRIPTION_INVALID")
  String description;

  @NotBlank(message = "REQUIRED_FIELD")
  String categoryId;
}
