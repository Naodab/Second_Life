package com.naodab.authservice.security.oauth2;

public final class OAuth2FlowConstants {

  private OAuth2FlowConstants() {}

  /** OAuth2Error.error for email already used with LOCAL (or other) provider */
  public static final String ERROR_USER_EXISTS_DIFFERENT_PROVIDER = "user_exists_different_provider";
}
