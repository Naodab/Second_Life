package com.naodab.authservice.security.oauth2;

import java.util.Map;

public abstract class OAuth2UserInfo {
  protected Map<String, Object> attributes;

  protected OAuth2UserInfo(Map<String, Object> attributes) {
    this.attributes = attributes;
  }

  public Map<String, Object> getAttributes() {
    return attributes;
  }

  public abstract String getId();
  public abstract String getName();
  public abstract String getEmail();
  public abstract String getImageUrl();
  public abstract String getGivenName();
  public abstract String getFamilyName();

  public String getPhoneNumber() {
    return null;
  }

  public String getFirstName() {
    return getGivenName();
  }

  public String getLastName() {
    return getFamilyName();
  }

  public String getAvatarUrl() {
    return getImageUrl();
  }
}
