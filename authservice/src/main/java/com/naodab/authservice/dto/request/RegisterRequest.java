package com.naodab.authservice.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class RegisterRequest {
  @NotBlank(message = "REQUIRED_FIELD")
  @Email(message = "EMAIL_INVALID")
  String email;

  @NotBlank(message = "REQUIRED_FIELD")
  @Size(min = 6, message = "PASSWORD_TOO_SHORT")
  String password;
}
