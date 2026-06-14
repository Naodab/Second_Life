package com.naodab.authservice.config;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import jakarta.annotation.PreDestroy;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class HttpCookieOAuth2AuthorizationRequestRepository
    implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

  private static final String OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME = "oauth2_auth_request";
  public static final String REDIRECT_URI_PARAM_COOKIE_NAME = "redirect_uri";
  public static final String OAUTH_ENTRY_PARAM_NAME = "oauth_entry";
  public static final String OAUTH_ENTRY_COOKIE_NAME = "oauth_entry";
  private static final int COOKIE_EXPIRE_SECONDS = 180;

  private final ConcurrentHashMap<String, OAuth2AuthorizationRequest> authorizationRequests = new ConcurrentHashMap<>();
  private final ScheduledExecutorService evictor = Executors.newSingleThreadScheduledExecutor(r -> {
    Thread thread = new Thread(r, "oauth2-auth-request-evictor");
    thread.setDaemon(true);
    return thread;
  });

  @Override
  public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
    String state = request.getParameter("state");
    if (StringUtils.hasText(state)) {
      OAuth2AuthorizationRequest fromMemory = authorizationRequests.get(state);
      if (fromMemory != null) {
        return fromMemory;
      }
    }

    return CookieUtils.getCookie(request, OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME)
        .map(cookie -> CookieUtils.deserialize(cookie, OAuth2AuthorizationRequest.class))
        .orElse(null);
  }

  @Override
  public void saveAuthorizationRequest(
      OAuth2AuthorizationRequest authorizationRequest,
      HttpServletRequest request,
      HttpServletResponse response) {
    if (authorizationRequest == null) {
      CookieUtils.deleteCookie(request, response, OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME);
      CookieUtils.deleteCookie(request, response, REDIRECT_URI_PARAM_COOKIE_NAME);
      CookieUtils.deleteCookie(request, response, OAUTH_ENTRY_COOKIE_NAME);
      return;
    }

    CookieUtils.deleteCookie(request, response, OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME);

    String state = authorizationRequest.getState();
    if (StringUtils.hasText(state)) {
      authorizationRequests.put(state, authorizationRequest);
      evictor.schedule(() -> authorizationRequests.remove(state), COOKIE_EXPIRE_SECONDS, TimeUnit.SECONDS);
    }

    String redirectUriAfterLogin = request.getParameter(REDIRECT_URI_PARAM_COOKIE_NAME);
    if (redirectUriAfterLogin != null && !redirectUriAfterLogin.isBlank()) {
      CookieUtils.addCookie(response, REDIRECT_URI_PARAM_COOKIE_NAME,
          redirectUriAfterLogin, COOKIE_EXPIRE_SECONDS);
    }

    String oauthEntry = request.getParameter(OAUTH_ENTRY_PARAM_NAME);
    if (oauthEntry != null && !oauthEntry.isBlank()) {
      String normalized = oauthEntry.trim().toLowerCase();
      if ("login".equals(normalized) || "register".equals(normalized)) {
        CookieUtils.addCookie(response, OAUTH_ENTRY_COOKIE_NAME, normalized, COOKIE_EXPIRE_SECONDS);
      }
    }
  }

  @Override
  public OAuth2AuthorizationRequest removeAuthorizationRequest(
      HttpServletRequest request,
      HttpServletResponse response) {
    OAuth2AuthorizationRequest loaded = loadAuthorizationRequest(request);
    if (loaded != null && StringUtils.hasText(loaded.getState())) {
      authorizationRequests.remove(loaded.getState());
    }
    return loaded;
  }

  public void removeAuthorizationRequestCookies(
      HttpServletRequest request,
      HttpServletResponse response) {
    CookieUtils.deleteCookie(request, response, OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME);
    CookieUtils.deleteCookie(request, response, REDIRECT_URI_PARAM_COOKIE_NAME);
    CookieUtils.deleteCookie(request, response, OAUTH_ENTRY_COOKIE_NAME);
  }

  @PreDestroy
  void shutdownEvictor() {
    evictor.shutdownNow();
  }
}
