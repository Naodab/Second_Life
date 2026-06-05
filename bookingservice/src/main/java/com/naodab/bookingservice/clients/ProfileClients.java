package com.naodab.bookingservice.clients;

import java.util.Objects;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.commonservice.response.ApiResponse;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProfileClients {

  RestTemplate restTemplate;

  @NonFinal
  @Value("${external.profile-service.url}")
  String profileServiceUrl;

  public String getProfileEmail(String profileId) {
    if (!StringUtils.hasText(profileId)) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    String base = stripTrailingSlashes(profileServiceUrl.trim());
    String uri = base + "/profiles/" + profileId.trim();
    try {
      ResponseEntity<ApiResponse<ProfileLookupResponse>> response = restTemplate.exchange(
          Objects.requireNonNull(uri),
          Objects.requireNonNull(HttpMethod.GET),
          HttpEntity.EMPTY,
          new ParameterizedTypeReference<ApiResponse<ProfileLookupResponse>>() {});
      ApiResponse<ProfileLookupResponse> body = response.getBody();
      if (response.getStatusCode() != HttpStatus.OK || body == null || body.getData() == null) {
        throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
      }
      String email = body.getData().getEmail();
      if (!StringUtils.hasText(email)) {
        throw new AppException(ErrorCode.PROFILE_NOT_FOUND);
      }
      return email.trim();
    } catch (HttpClientErrorException.NotFound e) {
      throw new AppException(ErrorCode.PROFILE_NOT_FOUND);
    } catch (RestClientException e) {
      log.error("Profile service call failed ({}): {}", uri, e.getMessage());
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  private static String stripTrailingSlashes(String url) {
    int end = url.length();
    while (end > 0 && url.charAt(end - 1) == '/') {
      end--;
    }
    return end == url.length() ? url : url.substring(0, end);
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  private static class ProfileLookupResponse {
    private String email;

    public String getEmail() {
      return email;
    }

    public void setEmail(String email) {
      this.email = email;
    }
  }
}
