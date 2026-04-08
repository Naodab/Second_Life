package com.naodab.commonservice.exception;

import org.springframework.http.HttpStatus;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
  INTERNAL_SERVER_ERROR(9999, "Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR),
  INVALID_INPUT(1000, "Invalid Input", HttpStatus.BAD_REQUEST),
  PROFILE_NOT_FOUND(1002, "Profile Not Found", HttpStatus.NOT_FOUND),
  PROFILE_ALREADY_EXISTS(1003, "Profile already exists", HttpStatus.BAD_REQUEST),
  INVALID_EMAIL(1004, "Email is invalid", HttpStatus.BAD_REQUEST),
  INVALID_PASSWORD(1005, "Password length must be between {min} and {max} characters", HttpStatus.BAD_REQUEST),
  INVALID_FIRST_NAME(1006, "First name can not contain numbers or special characters", HttpStatus.BAD_REQUEST),
  INVALID_LAST_NAME(1007, "Last name can not contain numbers or special characters", HttpStatus.BAD_REQUEST),
  INVALID_PHONE_NUMBER(1008, "Phone number must start with +84 or 0 and followed by 9 digits", HttpStatus.BAD_REQUEST),
  USER_NOT_FOUND(1009, "User not found", HttpStatus.NOT_FOUND),
  INVALID_REDIRECT_URI(1010, "Invalid redirect URI", HttpStatus.BAD_REQUEST),
  EMAIL_ALREADY_EXISTS(1011, "Email already exists", HttpStatus.BAD_REQUEST),
  INVALID_REFRESH_TOKEN(1012, "Invalid refresh token", HttpStatus.BAD_REQUEST),
  INVALID_VERIFICATION_TOKEN(1013, "Invalid verification token", HttpStatus.BAD_REQUEST),
  INVALID_OLD_PASSWORD(1014, "Invalid old password", HttpStatus.BAD_REQUEST),
  FAIL_TO_SEND_EMAIL(1015, "Fail to send email", HttpStatus.INTERNAL_SERVER_ERROR),
  INVALID_EMAIL_FROM_OAUTH2_PROVIDER(1016, "Email not found from OAuth2 provider", HttpStatus.BAD_REQUEST),
  USER_ALREADY_EXISTS_WITH_DIFFERENT_PROVIDER(1017,
      "An account with this email already exists but is registered with a different provider", HttpStatus.BAD_REQUEST),
  INVALID_OAUTH2_PROVIDER(1018, "Invalid OAuth2 provider", HttpStatus.BAD_REQUEST),
  UNAUTHORIZED(1019, "Unauthorized", HttpStatus.UNAUTHORIZED),
  AVATAR_IS_NULL(1020, "Avatar is null", HttpStatus.BAD_REQUEST),
  CLOUDINARY_UPLOAD_FAIL(1021, "Fail to upload images", HttpStatus.BAD_REQUEST),
  FILE_IS_EMPTY(1022, "File is empty", HttpStatus.BAD_REQUEST),
  FILE_TOO_LARGE(1023, "File size < 10 MB", HttpStatus.BAD_REQUEST),
  NOT_ALLOWED_CONTENT_FILE(1024, "Content file is not allowed", HttpStatus.BAD_REQUEST),
  PROFILE_NOT_LINKED_TO_ACCOUNT(1025, "Profile is not linked to account yet", HttpStatus.BAD_REQUEST),
  EMAIL_REGISTERED_WITH_GOOGLE(1026,
      "This email is already registered with Google. Please sign in with Google.",
      HttpStatus.BAD_REQUEST),
  SIGN_IN_WITH_GOOGLE(1027, "This account uses Google sign-in. Use Google to log in.", HttpStatus.BAD_REQUEST),
  INVALID_BANK_ACCOUNT_NUMBER(1028, "Invalid bank account number", HttpStatus.BAD_REQUEST),
  INVALID_ACCOUNT_NAME(1029, "Account name can not contain numbers or special characters", HttpStatus.BAD_REQUEST),
  INVALID_BANK_ID(1030, "Invalid bank ID", HttpStatus.BAD_REQUEST),
  BANK_NOT_FOUND(1031, "Bank not found", HttpStatus.NOT_FOUND),
  BANK_ACCOUNT_NOT_FOUND(1032, "Bank account not found", HttpStatus.NOT_FOUND),
  BANK_ACCOUNT_ALREADY_EXISTS(1033, "Bank account already exists", HttpStatus.BAD_REQUEST),
  BANK_ACCOUNT_NOT_LINKED_TO_PROFILE(1034, "Bank account is not linked to profile yet", HttpStatus.BAD_REQUEST),
  BANK_ACCOUNT_ALREADY_LINKED_TO_PROFILE(1035, "Bank account is already linked to profile", HttpStatus.BAD_REQUEST),
  BANK_ACCOUNT_NOT_LINKED_TO_BANK(1036, "Bank account is not linked to bank yet", HttpStatus.BAD_REQUEST),
  PROVINCE_NOT_FOUND(1037, "Province not found", HttpStatus.NOT_FOUND),
  WARD_NOT_FOUND(1038, "Ward not found", HttpStatus.NOT_FOUND),
  CATEGORY_ALREADY_EXISTS(1039, "Category already exists", HttpStatus.BAD_REQUEST),
  CATEGORY_NOT_FOUND(1040, "Category not found", HttpStatus.NOT_FOUND),
  SUB_CATEGORY_ALREADY_EXISTS(1041, "Sub category already exists", HttpStatus.BAD_REQUEST),
  SUB_CATEGORY_NOT_FOUND(1042, "Sub category not found", HttpStatus.NOT_FOUND),
  ;

  private int code;
  private String message;
  private HttpStatus httpStatus;

  ErrorCode(int code, String message, HttpStatus httpStatus) {
    this.code = code;
    this.message = message;
    this.httpStatus = httpStatus;
  }
}
