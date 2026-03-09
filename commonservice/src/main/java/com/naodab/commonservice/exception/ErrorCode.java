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
  INVALID_PHONE_NUMBER(1008, "Phone number must start with +84 or 0 and followed by 9 digits", HttpStatus.BAD_REQUEST)
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
