package com.naodab.productservice.dto.request;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public abstract class ProductUpsertRequest {
  @NotBlank(message = "REQUIRED_FIELD")
  @Size(min = 3, max = 255, message = "NAME_INVALID")
  String name;

  @Size(max = 8096, message = "DESCRIPTION_INVALID")
  String description;

  @NotEmpty(message = "REQUIRED_FIELD")
  List<String> subCategoryIds;

  @NotBlank(message = "REQUIRED_FIELD")
  String primarySubCategoryId;

  @NotEmpty(message = "REQUIRED_FIELD")
  List<String> attributeIds;

  @Valid
  @NotEmpty(message = "REQUIRED_FIELD")
  List<ProductVariantCreateRequest> variants;
}
