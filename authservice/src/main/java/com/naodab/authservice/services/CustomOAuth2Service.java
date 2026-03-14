package com.naodab.authservice.services;

import org.springframework.security.oauth2.core.user.OAuth2User;

public interface CustomOAuth2Service {
  OAuth2User loadUser(String idTokenString) throws Exception;
}
