package com.naodab.mailservice.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.naodab.commonservice.constant.AppConstants;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.commonservice.response.ApiResponse;
import com.naodab.mailservice.dto.ConversationResponse;
import com.naodab.mailservice.dto.CreateAdminConversationRequest;
import com.naodab.mailservice.dto.CreateConversationRequest;
import com.naodab.mailservice.dto.MessageResponse;
import com.naodab.mailservice.dto.SendMessageRequest;
import com.naodab.mailservice.service.ConversationService;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/conversations")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ConversationController {

  ConversationService conversationService;

  @GetMapping
  public ResponseEntity<ApiResponse<List<ConversationResponse>>> listConversations(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader,
      @RequestHeader(value = AppConstants.JWT_CLAIM_ROLE, required = false) String roleHeader,
      @RequestParam(defaultValue = "buyer") String role,
      @RequestParam(required = false) Integer limit) {
    String profileId = validateProfileId(profileIdHeader);
    boolean adminRole = isAdminRole(roleHeader);
    List<ConversationResponse> data;
    if ("admin".equalsIgnoreCase(role)) {
      if (!adminRole) {
        throw new AppException(ErrorCode.FORBIDDEN);
      }
      data = conversationService.listAdminSupportInbox(limit);
    } else if ("admin-support".equalsIgnoreCase(role)) {
      if (adminRole) {
        throw new AppException(ErrorCode.FORBIDDEN);
      }
      data = conversationService.listAdminSupportAsUser(profileId, limit);
    } else if ("seller".equalsIgnoreCase(role)) {
      data = conversationService.listAsSeller(profileId, limit);
    } else {
      data = conversationService.listAsBuyer(profileId, limit);
    }
    return ResponseEntity.ok(ApiResponse.<List<ConversationResponse>>builder().data(data).build());
  }

  @PostMapping
  public ResponseEntity<ApiResponse<ConversationResponse>> createConversation(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader,
      @Valid @RequestBody CreateConversationRequest request) {
    return ResponseEntity.ok(ApiResponse.<ConversationResponse>builder()
        .data(conversationService.getOrCreate(validateProfileId(profileIdHeader), request))
        .build());
  }

  @PostMapping("/admin")
  public ResponseEntity<ApiResponse<ConversationResponse>> createAdminSupportConversation(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader,
      @RequestHeader(value = AppConstants.JWT_CLAIM_ROLE, required = false) String roleHeader,
      @RequestBody(required = false) CreateAdminConversationRequest request) {
    if (isAdminRole(roleHeader)) {
      throw new AppException(ErrorCode.FORBIDDEN);
    }
    return ResponseEntity.ok(ApiResponse.<ConversationResponse>builder()
        .data(conversationService.getOrCreateAdminSupport(
            validateProfileId(profileIdHeader),
            request == null ? new CreateAdminConversationRequest() : request))
        .build());
  }

  @GetMapping("/{id}/messages")
  public ResponseEntity<ApiResponse<List<MessageResponse>>> listMessages(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader,
      @RequestHeader(value = AppConstants.JWT_CLAIM_ROLE, required = false) String roleHeader,
      @PathVariable String id,
      @RequestParam(required = false) Integer limit) {
    return ResponseEntity.ok(ApiResponse.<List<MessageResponse>>builder()
        .data(conversationService.listMessages(
            validateProfileId(profileIdHeader), id, limit, isAdminRole(roleHeader)))
        .build());
  }

  @PostMapping("/{id}/messages")
  public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader,
      @RequestHeader(value = AppConstants.JWT_CLAIM_ROLE, required = false) String roleHeader,
      @PathVariable String id,
      @Valid @RequestBody SendMessageRequest request) {
    return ResponseEntity.ok(ApiResponse.<MessageResponse>builder()
        .data(conversationService.sendMessage(
            validateProfileId(profileIdHeader), id, request, isAdminRole(roleHeader)))
        .build());
  }

  @PatchMapping("/{id}/read")
  public ResponseEntity<ApiResponse<ConversationResponse>> markRead(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader,
      @RequestHeader(value = AppConstants.JWT_CLAIM_ROLE, required = false) String roleHeader,
      @PathVariable String id) {
    return ResponseEntity.ok(ApiResponse.<ConversationResponse>builder()
        .data(conversationService.markRead(
            validateProfileId(profileIdHeader), id, isAdminRole(roleHeader)))
        .build());
  }

  private static String validateProfileId(String profileIdHeader) {
    if (!StringUtils.hasText(profileIdHeader)) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }
    return profileIdHeader.trim();
  }

  private static boolean isAdminRole(String roleHeader) {
    return AppConstants.ROLE_ADMIN.equalsIgnoreCase(roleHeader == null ? "" : roleHeader.trim());
  }
}
