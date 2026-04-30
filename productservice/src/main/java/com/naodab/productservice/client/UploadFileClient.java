package com.naodab.productservice.client;

import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import java.util.List;

import com.naodab.commonservice.utils.MultipartInputStreamFileResource;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UploadFileClient {
  RestTemplate restTemplate;

  @NonFinal
  @Value("${external.upload-service.url}")
  String uploadServiceUrl;

  @Async
  public void uploadMainImageFacility(String facilityId, MultipartFile image) {
    try {
      String url = uploadServiceUrl + "/upload/facility-image";
      MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
      body.add("facilityId", facilityId);
      body.add("image", new MultipartInputStreamFileResource(
          image.getInputStream(),
          image.getOriginalFilename()));

      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.MULTIPART_FORM_DATA);
      HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

      String response = restTemplate.postForObject(url, request, String.class);
      log.info("Upload main image facility success: {}", response);
    } catch (Exception e) {
      log.error("Upload main image facility failed", e);
    }
  }

  @Async
  public void uploadProductImages(String productId, MultipartFile thumbnailImage, List<MultipartFile> productImages) {
    log.info("Skip upload product images for productId={} until upload-service endpoint is ready", productId);
    // TODO: integrate upload-service endpoint for product images.
    // Expected payload:
    // - productId
    // - thumbnailImage (single file)
    // - productImages (multiple files)
  }
}
