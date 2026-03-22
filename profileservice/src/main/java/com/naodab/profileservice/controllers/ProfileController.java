package com.naodab.profileservice.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.naodab.commonservice.response.ApiResponse;
import com.naodab.profileservice.dto.request.ProfileCreateRequest;
import com.naodab.profileservice.dto.request.ProfileUpdateRequest;
import com.naodab.profileservice.dto.request.UploadAvatarRequest;
import com.naodab.profileservice.dto.response.ProfileResponse;
import com.naodab.profileservice.services.ProfileService;

import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/profiles")
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class ProfileController {
  static final String HEADER_USER_EMAIL = "X-User-Email";

  ProfileService profileService;

  public ProfileController(ProfileService profileService) {
    this.profileService = profileService;
  }

  @PostMapping
  public ResponseEntity<ApiResponse<ProfileResponse>> create(@RequestBody @Validated ProfileCreateRequest request) {
    return ResponseEntity.ok(
        ApiResponse.<ProfileResponse>builder()
            .data(profileService.createProfile(request))
            .build());
  }

  @GetMapping
  public ResponseEntity<ApiResponse<List<ProfileResponse>>> getMethodName(
      @RequestParam(required = false, defaultValue = "0") int page,
      @RequestParam(required = false, defaultValue = "10") int pageSize) {
    return ResponseEntity.ok(
        ApiResponse.<List<ProfileResponse>>builder()
            .data(profileService.getAllProfiles(page, pageSize))
            .build());
  }

  @GetMapping("/{id}")
  public ResponseEntity<ApiResponse<ProfileResponse>> getById(@PathVariable String id) {
    return ResponseEntity.ok(
        ApiResponse.<ProfileResponse>builder()
            .data(profileService.getProfileById(id))
            .build());
  }

  @PutMapping("/{id}")
  public ResponseEntity<ApiResponse<ProfileResponse>> update(
      @PathVariable String id,
      @RequestBody @Validated ProfileUpdateRequest request) {
    return ResponseEntity.ok(
        ApiResponse.<ProfileResponse>builder()
            .data(profileService.updateProfile(id, request))
            .build());
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
    profileService.deleteProfile(id);
    return ResponseEntity.ok(
        ApiResponse.<Void>builder()
            .data(null)
            .message("Delete profile successfully")
            .build());
  }

  @PutMapping("/upload-avatar")
  public ResponseEntity<ApiResponse<Void>> uploadAvatar(
      @RequestHeader(value = HEADER_USER_EMAIL, required = false) String userEmail,
      @RequestParam MultipartFile avatar) {

    if (!StringUtils.hasText(userEmail)) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
          .body(ApiResponse.<Void>builder()
              .data(null)
              .message("Missing authenticated user; gateway must send " + HEADER_USER_EMAIL)
              .build());
    }

    UploadAvatarRequest request = UploadAvatarRequest.builder()
        .email(userEmail.trim())
        .avatar(avatar)
        .build();

    profileService.uploadAvatarFromEvent(request);
    return ResponseEntity.ok(
        ApiResponse.<Void>builder()
            .data(null)
            .message("Upload avatar successfully")
            .build());
  }
}
