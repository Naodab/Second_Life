package com.naodab.profileservice.clients;

import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;

import com.naodab.commonservice.constant.AppConstants;
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

  @NonFinal
  @Value("${upload-service.url}")
  String uploadServiceUrl;

  RestTemplate restTemplate;

  @Async
  public void uploadAvatar(String profileId, MultipartFile avatar) {
    try {
      String url = uploadServiceUrl + "/upload/avatar";

      MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
      body.add("profileId", profileId);
      body.add("avatar", new MultipartInputStreamFileResource(
          avatar.getInputStream(),
          avatar.getOriginalFilename()));

      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.MULTIPART_FORM_DATA);
      headers.set(AppConstants.HEADER_PROFILE_ID, profileId);

      HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

      String response = restTemplate.postForObject(url, request, String.class);
      log.info("Upload success: {}", response);
    } catch (Exception e) {
      log.error("Upload failed", e);
    }
  }
}
