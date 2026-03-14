package com.naodab.authservice.security.oauth2;

import java.io.IOException;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import com.naodab.authservice.config.CookieUtils;
import com.naodab.authservice.config.HttpCookieOAuth2AuthorizationRequestRepository;
import com.naodab.authservice.models.Account;
import com.naodab.authservice.properties.OAuth2Properties;
import com.naodab.authservice.repositories.AccountRepository;
import com.naodab.authservice.security.JwtTokenProvider;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

  JwtTokenProvider tokenProvider;
  AccountRepository accountRepository;
  OAuth2Properties oAuth2Properties;

  @Override
  public void onAuthenticationSuccess(
      HttpServletRequest request,
      HttpServletResponse response,
      Authentication authentication) throws IOException {
    String targetUrl = determineTargetUrl(request, response, authentication);

    if (response.isCommitted()) {
      log.debug("Response has already been committed. Unable to redirect to " + targetUrl);
      return;
    }

    clearAuthenticationAttributes(request);
    getRedirectStrategy().sendRedirect(request, response, targetUrl);
  }

  @Override
  protected String determineTargetUrl(
      HttpServletRequest request,
      HttpServletResponse response,
      Authentication authentication) {
    String targetUrl = CookieUtils
        .getCookie(request, HttpCookieOAuth2AuthorizationRequestRepository.REDIRECT_URI_PARAM_COOKIE_NAME)
        .map(Cookie::getValue)
        .filter(uri -> isAuthorizedRedirectUri(uri))
        .orElse(oAuth2Properties.getAuthorizedRedirectUris().get(0));

    OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
    String email = oauth2User.getAttribute("email");

    if (targetUrl != null && !isAuthorizedRedirectUri(targetUrl)) {
      throw new IllegalArgumentException("Unauthorized Redirect URI: " + targetUrl);
    }

    Account account = accountRepository.findByEmail(email)
        .orElseThrow(() -> new RuntimeException("User not found: " + email));

    String accessToken = tokenProvider.generateAccessToken(email);
    String refreshToken = tokenProvider.generateRefreshToken(email);

    account.setRefreshToken(refreshToken);
    accountRepository.save(account);

    return UriComponentsBuilder.fromUriString(targetUrl)
        .queryParam("token", accessToken)
        .queryParam("refresh_token", refreshToken)
        .build().toUriString();
  }

  private boolean isAuthorizedRedirectUri(String uri) {
    return oAuth2Properties.getAuthorizedRedirectUris().stream()
        .anyMatch(authorizedUri -> authorizedUri.equalsIgnoreCase(uri));
  }
}
