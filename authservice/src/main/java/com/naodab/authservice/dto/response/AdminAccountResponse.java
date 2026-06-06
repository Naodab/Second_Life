package com.naodab.authservice.dto.response;

import java.time.LocalDateTime;

import com.naodab.authservice.models.Account.Role;
import com.naodab.authservice.models.AuthProvider;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminAccountResponse {
  String id;
  String email;
  Role role;
  AuthProvider authProvider;
  Boolean emailVerified;
  Boolean active;
  String profileId;
  LocalDateTime createdAt;
  AdminAccountProfileSummary profile;
}
