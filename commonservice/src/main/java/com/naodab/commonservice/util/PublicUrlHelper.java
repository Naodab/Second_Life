package com.naodab.commonservice.util;

import org.springframework.util.StringUtils;

public final class PublicUrlHelper {

  private static final String DEFAULT_GATEWAY = "http://localhost:8080";
  private static final String API_CONTEXT = "/api/v1";

  private PublicUrlHelper() {
  }

  public static String stripTrailingSlash(String url) {
    if (!StringUtils.hasText(url)) {
      return "";
    }
    String trimmed = url.trim();
    int end = trimmed.length();
    while (end > 0 && trimmed.charAt(end - 1) == '/') {
      end--;
    }
    return end == trimmed.length() ? trimmed : trimmed.substring(0, end);
  }

  public static String resolveAuthPublicApiBase(String authPublicBaseUrl, String gatewayUrl) {
    if (StringUtils.hasText(authPublicBaseUrl)) {
      return stripTrailingSlash(authPublicBaseUrl);
    }
    String gateway = StringUtils.hasText(gatewayUrl) ? stripTrailingSlash(gatewayUrl) : DEFAULT_GATEWAY;
    if (gateway.endsWith(API_CONTEXT)) {
      return gateway;
    }
    return gateway + API_CONTEXT;
  }

  public static String buildVerifyEmailUrl(String authPublicApiBase, String verificationToken) {
    return stripTrailingSlash(authPublicApiBase) + "/auth/verify-email?verificationToken=" + verificationToken;
  }

  public static String buildEmailVerifiedRedirectUrl(String frontendUrl) {
    return stripTrailingSlash(
        StringUtils.hasText(frontendUrl) ? frontendUrl : "http://localhost:5173") + "/email-verified";
  }
}
