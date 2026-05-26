package com.naodab.commonservice.exception;

import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.RestClientException;

import com.naodab.commonservice.response.ApiResponse;

import jakarta.validation.ConstraintViolation;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
  private static final List<String> ATTRIBUTE_KEYS = List.of("min", "max");

  @ExceptionHandler(AppException.class)
  public ResponseEntity<ApiResponse<?>> handleAppException(AppException ex) {
    ErrorCode errorCode = ex.getErrorCode();
    if (errorCode.getHttpStatus().is5xxServerError()) {
      log.error("AppException [{}]: {}", errorCode.getCode(), errorCode.getMessage(), ex);
    } else {
      log.warn("AppException [{}]: {}", errorCode.getCode(), errorCode.getMessage());
    }
    return ResponseEntity.status(errorCode.getHttpStatus().value())
        .body(ApiResponse.builder()
            .code(errorCode.getCode())
            .message(errorCode.getMessage())
            .build());
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<ApiResponse<?>> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
    log.warn("Malformed request body: {}", ex.getMostSpecificCause().getMessage());
    return ResponseEntity.badRequest()
        .body(ApiResponse.builder()
            .code(ErrorCode.INVALID_INPUT.getCode())
            .message(ErrorCode.INVALID_INPUT.getMessage())
            .build());
  }

  @ExceptionHandler(RestClientException.class)
  public ResponseEntity<ApiResponse<?>> handleRestClientException(RestClientException ex) {
    log.error("Downstream HTTP client error: {}", ex.getMessage(), ex);
    return ResponseEntity.status(ErrorCode.FACILITY_LOCATION_INVALID.getHttpStatus())
        .body(ApiResponse.builder()
            .code(ErrorCode.FACILITY_LOCATION_INVALID.getCode())
            .message(ErrorCode.FACILITY_LOCATION_INVALID.getMessage())
            .build());
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiResponse<?>> handleGenericException(Exception ex) {
    if (isDataIntegrityViolation(ex)) {
      log.error("Data integrity violation: {}", deepestMessage(ex), ex);
      return ResponseEntity.badRequest()
          .body(ApiResponse.builder()
              .code(ErrorCode.INVALID_INPUT.getCode())
              .message(ErrorCode.INVALID_INPUT.getMessage())
              .build());
    }
    log.error("Unhandled exception: {}", ex.getMessage(), ex);
    return ResponseEntity.status(500)
        .body(ApiResponse.builder()
            .code(ErrorCode.INTERNAL_SERVER_ERROR.getCode())
            .message(ErrorCode.INTERNAL_SERVER_ERROR.getMessage())
            .build());
  }

  private static boolean isDataIntegrityViolation(Throwable ex) {
    for (Throwable t = ex; t != null; t = t.getCause()) {
      if ("org.springframework.dao.DataIntegrityViolationException".equals(t.getClass().getName())) {
        return true;
      }
    }
    return false;
  }

  private static String deepestMessage(Throwable ex) {
    Throwable root = ex;
    while (root.getCause() != null) {
      root = root.getCause();
    }
    String msg = root.getMessage();
    return msg != null ? msg : ex.getMessage();
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
