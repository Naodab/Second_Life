package com.naodab.commonservice.constant;

public class AppConstants {
  private AppConstants() {
  }

  public static final String AUTH_HEADER = "Authorization";

  public static final String BEARER = "Bearer ";

  public static final String HEADER_PROFILE_ID = "X-Profile-Id";

  public static final String HEADER_USER_EMAIL = "X-User-Email";

  public static final String JWT_CLAIM_PROFILE_ID = "profileId";

  public static final String JWT_CLAIM_ROLE = "role";

  public static final String ROLE_ADMIN = "ADMIN";
  public static final String ROLE_USER = "USER";
}
