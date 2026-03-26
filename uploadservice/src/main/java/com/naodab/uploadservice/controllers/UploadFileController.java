package com.naodab.uploadservice.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.naodab.commonservice.constant.AppConstants;
import com.naodab.uploadservice.dto.events.UpdateAvatarEvent;
import com.naodab.uploadservice.services.UploadService;
import com.naodab.uploadservice.kafka.producers.UpdateAvatarProducer;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import lombok.AccessLevel;

@RestController
@RequestMapping("/upload")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UploadFileController {

  UploadService uploadService;
  UpdateAvatarProducer updateAvatarProducer;

  @PostMapping("/avatar")
  public ResponseEntity<Void> uploadAvatar(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileId,
      @RequestParam MultipartFile avatar) {

    String avatarUrl = uploadService.upload(avatar);
    updateAvatarProducer.send(UpdateAvatarEvent.builder()
        .profileId(profileId)
        .avatarUrl(avatarUrl)
        .build());

    return ResponseEntity.ok().build();
  }
}
