package com.naodab.productservice.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class AttributeCreateRequest {
  @NotBlank(message = "REQUIRED_FIELD")
  @Size(min = 3, max = 255, message = "NAME_INVALID")
  String name;

  @NotEmpty(message = "REQUIRED_FIELD")
  List<String> values;
}
