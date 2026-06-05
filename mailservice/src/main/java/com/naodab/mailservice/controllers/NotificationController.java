package com.naodab.mailservice.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.naodab.commonservice.constant.AppConstants;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.commonservice.response.ApiResponse;
import com.naodab.mailservice.dto.NotificationResponse;
import com.naodab.mailservice.service.NotificationService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.util.StringUtils;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotificationController {

  NotificationService notificationService;

  @GetMapping
  public ResponseEntity<ApiResponse<List<NotificationResponse>>> listNotifications(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader,
      @RequestParam(required = false) Integer limit) {
    return ResponseEntity.ok(ApiResponse.<List<NotificationResponse>>builder()
        .data(notificationService.listForProfile(validateProfileId(profileIdHeader), limit))
        .build());
  }

  @GetMapping("/unread-count")
  public ResponseEntity<ApiResponse<Map<String, Long>>> unreadCount(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader) {
    long count = notificationService.countUnread(validateProfileId(profileIdHeader));
    return ResponseEntity.ok(ApiResponse.<Map<String, Long>>builder()
        .data(Map.of("count", count))
        .build());
  }

  @PatchMapping("/{id}/read")
  public ResponseEntity<ApiResponse<NotificationResponse>> markRead(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader,
      @PathVariable String id) {
    return ResponseEntity.ok(ApiResponse.<NotificationResponse>builder()
        .data(notificationService.markRead(validateProfileId(profileIdHeader), id))
        .build());
  }

  @PatchMapping("/read-all")
  public ResponseEntity<ApiResponse<Void>> markAllRead(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader) {
    notificationService.markAllRead(validateProfileId(profileIdHeader));
    return ResponseEntity.ok(ApiResponse.<Void>builder().build());
  }

  private static String validateProfileId(String profileIdHeader) {
    if (!StringUtils.hasText(profileIdHeader)) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }
    return profileIdHeader.trim();
  }
}
