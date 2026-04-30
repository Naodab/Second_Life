package com.naodab.productservice.dto.request;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
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
public class UploadProductImagesRequest {
  @NotBlank(message = "REQUIRED_FIELD")
  String thumbnailUrl;

  @NotEmpty(message = "REQUIRED_FIELD")
  List<String> productImageUrls;
}
