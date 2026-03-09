package com.naodab.commonservice.exception;

import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.naodab.commonservice.response.ApiResponse;

import jakarta.validation.ConstraintViolation;

@RestControllerAdvice
public class GlobalExceptionHandler {
  private static final List<String> ATTRIBUTE_KEYS = List.of("min", "max");

  @ExceptionHandler(AppException.class)
  public ResponseEntity<ApiResponse<?>> handleAppException(AppException ex) {
    ErrorCode errorCode = ex.getErrorCode();
    return ResponseEntity.status(errorCode.getHttpStatus().value())
        .body(ApiResponse.builder()
            .code(errorCode.getCode())
            .message(errorCode.getMessage())
            .build());
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiResponse<?>> handleGenericException(Exception ex) {
    return ResponseEntity.status(500)
        .body(ApiResponse.builder()
            .code(ErrorCode.INTERNAL_SERVER_ERROR.getCode())
            .message(ErrorCode.INTERNAL_SERVER_ERROR.getMessage())
            .build());
  }

  @SuppressWarnings("unchecked")
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiResponse<?>> handleMethodArgumentNotValidException(MethodArgumentNotValidException ex) {
    ErrorCode errorCode = ErrorCode.INVALID_INPUT;
    String enumKey = null;
    var fieldError = ex.getFieldError();
    if (fieldError != null) {
      enumKey = fieldError.getDefaultMessage();
    }

    Map<String, Object> attributes = null;
    if (enumKey != null) {
      try {
        errorCode = ErrorCode.valueOf(enumKey);
        var constraintViolation = ex.getBindingResult().getAllErrors().get(0).unwrap(ConstraintViolation.class);
        attributes = constraintViolation.getConstraintDescriptor().getAttributes();
      } catch (Exception e) {
        errorCode = ErrorCode.INVALID_INPUT;
      }
    }

    return ResponseEntity.badRequest()
      .body(ApiResponse.builder()
        .code(errorCode.getCode())
        .message(Objects.nonNull(attributes)
                  ? mapAttribute(errorCode.getMessage(), attributes)
                  : errorCode.getMessage())
        .build());
  }

  private String mapAttribute(String message, Map<String, Object> attributes) {
    for (String key : ATTRIBUTE_KEYS) {
      if (message.contains("{" + key + "}")) {
        message = message.replace("{" + key + "}", String.valueOf(attributes.get(key)));
      }
    }

    return message;
  }
}
