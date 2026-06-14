package com.naodab.authservice.security.oauth2;

import java.util.List;
import java.util.Optional;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.naodab.authservice.config.CookieUtils;
import com.naodab.authservice.config.HttpCookieOAuth2AuthorizationRequestRepository;
import com.naodab.authservice.dto.event.CreateProfileEvent;
import com.naodab.authservice.kafka.CreateProfileProducer;
import com.naodab.authservice.models.Account;
import com.naodab.authservice.models.AuthProvider;
import com.naodab.authservice.repositories.AccountRepository;
import com.naodab.commonservice.exception.ErrorCode;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

  private static final String OAUTH_ENTRY_LOGIN = "login";
  private static final String OAUTH_ENTRY_REGISTER = "register";

  AccountRepository accountRepository;
  CreateProfileProducer createProfileProducer;

  @Override
  public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
    OAuth2User oAuth2User = super.loadUser(userRequest);
    return processOAuth2User(userRequest, oAuth2User);
  }

  private OAuth2User processOAuth2User(OAuth2UserRequest userRequest, OAuth2User oAuth2User) {
    String registrationId = userRequest.getClientRegistration().getRegistrationId();
    OAuth2UserInfo userInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(registrationId, oAuth2User.getAttributes());

    if (!StringUtils.hasText(userInfo.getEmail())) {
      throw new OAuth2AuthenticationException(
          new OAuth2Error(
              "invalid_email_from_provider",
              ErrorCode.INVALID_EMAIL_FROM_OAUTH2_PROVIDER.getMessage(),
              null));
    }

    String oauthEntry = resolveOauthEntry();
    Account account = upsertAccount(userInfo, registrationId, oauthEntry);
    return new DefaultOAuth2User(
        List.of(new SimpleGrantedAuthority("ROLE_" + account.getRole().name())),
        oAuth2User.getAttributes(),
        "email");
  }

  private String resolveOauthEntry() {
    var attrs = RequestContextHolder.getRequestAttributes();
    if (!(attrs instanceof ServletRequestAttributes servletAttrs)) {
      return OAUTH_ENTRY_LOGIN;
    }
    HttpServletRequest request = servletAttrs.getRequest();
    return CookieUtils.getCookie(request, HttpCookieOAuth2AuthorizationRequestRepository.OAUTH_ENTRY_COOKIE_NAME)
        .map(Cookie::getValue)
        .map(String::trim)
        .map(String::toLowerCase)
        .filter(v -> OAUTH_ENTRY_LOGIN.equals(v) || OAUTH_ENTRY_REGISTER.equals(v))
        .orElse(OAUTH_ENTRY_LOGIN);
  }

  private Account upsertAccount(OAuth2UserInfo userInfo, String providerKey, String oauthEntry) {
    AuthProvider authProvider = AuthProvider.valueOf(providerKey.toUpperCase());
    boolean registerFlow = OAUTH_ENTRY_REGISTER.equals(oauthEntry);

    Optional<Account> byProvider = accountRepository.findByAuthProviderAndProviderId(authProvider, userInfo.getId());
    if (byProvider.isPresent()) {
      Account account = byProvider.get();
      if (registerFlow) {
        createProfileFromEvent(userInfo);
      }
      return account;
    }

    Optional<Account> byEmail = accountRepository.findByEmail(userInfo.getEmail());
    if (byEmail.isPresent()) {
      Account existing = byEmail.get();
      if (existing.getAuthProvider() != authProvider) {
        throw new OAuth2AuthenticationException(
            new OAuth2Error(
                OAuth2FlowConstants.ERROR_USER_EXISTS_DIFFERENT_PROVIDER,
                ErrorCode.USER_ALREADY_EXISTS_WITH_DIFFERENT_PROVIDER.getMessage(),
                null));
      }
      existing.setProviderId(userInfo.getId());
      existing.setAuthProvider(authProvider);
      existing.setEmailVerified(true);
      Account saved = accountRepository.save(existing);
      if (registerFlow) {
        createProfileFromEvent(userInfo);
      }
      return saved;
    }

    Account account = Account.builder()
        .email(userInfo.getEmail())
        .authProvider(authProvider)
        .providerId(userInfo.getId())
        .emailVerified(true)
        .build();

    account = accountRepository.save(account);
    createProfileFromEvent(userInfo);
    return account;
  }

  private void createProfileFromEvent(OAuth2UserInfo userInfo) {
    CreateProfileEvent event = CreateProfileEvent.builder()
        .email(userInfo.getEmail())
        .firstName(userInfo.getGivenName())
        .lastName(userInfo.getFamilyName())
        .avatarUrl(userInfo.getAvatarUrl())
        .phoneNumber(userInfo.getPhoneNumber())
        .build();

    createProfileProducer.sendCreateProfileEvent(event);
  }
}
