package com.naodab.authservice.security.oauth2;

import java.util.Map;

import com.naodab.authservice.models.AuthProvider;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;

public class OAuth2UserInfoFactory {

  public static OAuth2UserInfo getOAuth2UserInfo(String registrationId,
      Map<String, Object> attributes) {
    if (registrationId.equalsIgnoreCase(AuthProvider.GOOGLE.name())) {
      return new GoogleOAuth2UserInfo(attributes);
    }
    throw new AppException(ErrorCode.INVALID_OAUTH2_PROVIDER);
  }
}
