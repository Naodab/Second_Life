package com.naodab.authservice.security.oauth2;

import java.util.Map;

import com.naodab.authservice.models.AuthProvider;

public class OAuth2UserInfoFactory {

  public static OAuth2UserInfo getOAuth2UserInfo(String registrationId,
                                                  Map<String, Object> attributes) {
    if (registrationId.equalsIgnoreCase(AuthProvider.GOOGLE.name())) {
      return new GoogleOAuth2UserInfo(attributes);
    }
    throw new IllegalArgumentException("Provider [" + registrationId + "] không được hỗ trợ.");
  }
}
