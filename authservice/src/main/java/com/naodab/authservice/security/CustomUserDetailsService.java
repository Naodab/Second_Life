package com.naodab.authservice.security;

import java.util.List;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.naodab.authservice.models.Account;
import com.naodab.authservice.repositories.AccountRepository;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class CustomUserDetailsService implements UserDetailsService {
  AccountRepository accountRepository;

  @Override
  @Transactional(readOnly = true)
  public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    Account account = accountRepository.findByEmail(username)
      .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + username));

    String password = StringUtils.hasText(account.getPassword())
      ? account.getPassword()
      : "{noop}unused";

    return User.builder()
      .username(account.getEmail())
      .password(password)
      .authorities(List.of(new SimpleGrantedAuthority("ROLE_" + account.getRole().name())))
      .accountExpired(false)
      .accountLocked(!Boolean.TRUE.equals(account.getActive()))
      .credentialsExpired(false)
      .disabled(!Boolean.TRUE.equals(account.getActive()))
      .build();
  }
}
