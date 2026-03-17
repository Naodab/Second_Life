package com.naodab.authservice.security.oauth2;

import java.util.Map;

public abstract class OAuth2UserInfo {
  protected Map<String, Object> attributes;

  public OAuth2UserInfo(Map<String, Object> attributes) {
    this.attributes = attributes;
  }

  public Map<String, Object> getAttributes() {
    return attributes;
  }

  public abstract String getId();
  public abstract String getName();
  public abstract String getEmail();
  public abstract String getImageUrl();

  /** Given name (tên) – e.g. from OAuth2 given_name. */
  public abstract String getGivenName();
  /** Family name (họ) – e.g. from OAuth2 family_name. */
  public abstract String getFamilyName();
  /** Phone number – usually null from OAuth2, user can set later. */
  public String getPhoneNumber() {
    return null;
  }

  /** Alias for getGivenName(); use for firstName. */
  public String getFirstName() {
    return getGivenName();
  }
  /** Alias for getFamilyName(); use for lastName. */
  public String getLastName() {
    return getFamilyName();
  }
  /** Alias for getImageUrl(). */
  public String getAvatarUrl() {
    return getImageUrl();
  }
}
