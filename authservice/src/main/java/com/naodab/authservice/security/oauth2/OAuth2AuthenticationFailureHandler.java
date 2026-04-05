package com.naodab.authservice.security.oauth2;

import java.io.IOException;
import java.net.URI;

import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import com.naodab.authservice.config.CookieUtils;
import com.naodab.authservice.config.HttpCookieOAuth2AuthorizationRequestRepository;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationFailureHandler extends SimpleUrlAuthenticationFailureHandler {

  private static final String CALLBACK_PATH_SUFFIX = "/oauth2/callback/google";
  private static final String QUERY_DIFFERENT_PROVIDER_REGISTER = "different_provider_register";
  private static final String QUERY_DIFFERENT_PROVIDER_LOGIN = "different_provider_login";

  private final HttpCookieOAuth2AuthorizationRequestRepository authorizationRequestRepository;

  @Override
  public void onAuthenticationFailure(
      HttpServletRequest request,
      HttpServletResponse response,
      AuthenticationException exception) throws IOException {
    OAuth2Error oauth2Error = resolveOAuth2Error(exception);
    String redirectUriFromCookie =
        CookieUtils.getCookie(request, HttpCookieOAuth2AuthorizationRequestRepository.REDIRECT_URI_PARAM_COOKIE_NAME)
            .map(Cookie::getValue)
            .orElse(null);
    String oauthEntry =
        CookieUtils.getCookie(request, HttpCookieOAuth2AuthorizationRequestRepository.OAUTH_ENTRY_COOKIE_NAME)
            .map(Cookie::getValue)
            .orElse("login");

    String targetUrl = buildTargetUrl(request, oauth2Error, redirectUriFromCookie, oauthEntry, exception);

    log.error("OAuth2 authentication failed: {}", exception.getMessage());

    authorizationRequestRepository.removeAuthorizationRequestCookies(request, response);
    getRedirectStrategy().sendRedirect(request, response, targetUrl);
  }

  private String buildTargetUrl(
      HttpServletRequest request,
      OAuth2Error oauth2Error,
      String redirectUriFromCookie,
      String oauthEntry,
      AuthenticationException exception) {
    if (oauth2Error != null
        && OAuth2FlowConstants.ERROR_USER_EXISTS_DIFFERENT_PROVIDER.equals(oauth2Error.getErrorCode())
        && redirectUriFromCookie != null
        && !redirectUriFromCookie.isBlank()) {
      String appBase = resolveAppBaseFromOAuthCallbackUrl(redirectUriFromCookie);
      if ("register".equalsIgnoreCase(oauthEntry)) {
        return UriComponentsBuilder.fromUriString(appBase + "/register")
            .queryParam("oauth_error", QUERY_DIFFERENT_PROVIDER_REGISTER)
            .build()
            .toUriString();
      }
      return UriComponentsBuilder.fromUriString(appBase + "/login")
          .queryParam("oauth_error", QUERY_DIFFERENT_PROVIDER_LOGIN)
          .build()
          .toUriString();
    }

    String fallback = redirectUriFromCookie;
    if (fallback == null || fallback.isBlank()) {
      fallback = request.getParameter(HttpCookieOAuth2AuthorizationRequestRepository.REDIRECT_URI_PARAM_COOKIE_NAME);
    }
    if (fallback == null || fallback.isBlank()) {
      fallback = "/oauth2/redirect";
    }

    return UriComponentsBuilder.fromUriString(fallback)
        .queryParam("error", exception.getLocalizedMessage())
        .build()
        .toUriString();
  }

  private static String resolveAppBaseFromOAuthCallbackUrl(String callbackUrl) {
    URI u = URI.create(callbackUrl);
    String path = u.getPath();
    if (path != null && path.endsWith(CALLBACK_PATH_SUFFIX)) {
      String basePath = path.substring(0, path.length() - CALLBACK_PATH_SUFFIX.length());
      return u.getScheme() + "://" + u.getAuthority() + basePath;
    }
    return u.getScheme() + "://" + u.getAuthority();
  }

  private static OAuth2Error resolveOAuth2Error(AuthenticationException exception) {
    Throwable cause = exception;
    while (cause != null) {
      if (cause instanceof OAuth2AuthenticationException oae) {
        return oae.getError();
      }
      cause = cause.getCause();
    }
    return null;
  }
}
