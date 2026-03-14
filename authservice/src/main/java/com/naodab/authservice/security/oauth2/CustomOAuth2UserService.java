package com.naodab.authservice.security.oauth2;

import java.util.List;
import java.util.Optional;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.naodab.authservice.models.Account;
import com.naodab.authservice.models.AuthProvider;
import com.naodab.authservice.repositories.AccountRepository;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class CustomOAuth2UserService extends DefaultOAuth2UserService {
  AccountRepository accountRepository;

  @Override
  public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
    OAuth2User oAuth2User = super.loadUser(userRequest);
    return processOAuth2User(userRequest, oAuth2User);
  }

  private OAuth2User processOAuth2User(OAuth2UserRequest userRequest, OAuth2User oAuth2User) {
    String registrationId = userRequest.getClientRegistration().getRegistrationId();
    OAuth2UserInfo userInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(registrationId, oAuth2User.getAttributes());

    if (!StringUtils.hasText(userInfo.getEmail())) {
      throw new OAuth2AuthenticationException("Email not found from OAuth2 provider");
    }

    Account account = upsertAccount(userInfo, registrationId);
    return new DefaultOAuth2User(
      List.of(new SimpleGrantedAuthority("ROLE_" + account.getRole().name())),
      oAuth2User.getAttributes(),
      "email"
    );
  }

  private Account upsertAccount(OAuth2UserInfo userInfo, String provider) {
    AuthProvider authProvider = AuthProvider.valueOf(provider.toUpperCase());
    Optional<Account> accountOptional = accountRepository.findByAuthProviderAndProviderId(
      authProvider,
      userInfo.getId()
    );

    if (accountOptional.isPresent()) {
      return accountOptional.get();
    }

    Optional<Account> existingByEmail = accountRepository.findByEmail(userInfo.getEmail());
    if (existingByEmail.isPresent()) {
      Account account = existingByEmail.get();
      if (account.getAuthProvider() != authProvider) {
        throw new OAuth2AuthenticationException(
          "An account with this email already exists but is registered with a different provider"
        );
      }
      account.setProviderId(userInfo.getId());
      account.setAuthProvider(authProvider);
      return accountRepository.save(account);
    }

    Account account = Account.builder()
      .email(userInfo.getEmail())
      .authProvider(authProvider)
      .providerId(userInfo.getId())
      .build();

    return accountRepository.save(account);
  }
}
