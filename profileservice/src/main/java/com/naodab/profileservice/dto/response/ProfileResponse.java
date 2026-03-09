package com.naodab.profileservice.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class ProfileResponse {
  String id;
  String email;
  String phoneNumber;

  String firstName;
  String lastName;
  String avatarUrl;

  String role;
  String status;

  LocalDateTime createdAt;
  LocalDateTime updatedAt;
  LocalDateTime deletedAt;
}
