package com.naodab.productservice.dto.request;

import java.util.ArrayList;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
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

  @Builder.Default
  List<String> productImageUrls = new ArrayList<>();

  String videoUrl;
}
