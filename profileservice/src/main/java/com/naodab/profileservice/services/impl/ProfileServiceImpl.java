package com.naodab.profileservice.services.impl;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.profileservice.dto.event.CreateProfileEvent;
import com.naodab.profileservice.dto.request.ProfileCreateRequest;
import com.naodab.profileservice.dto.request.ProfileUpdateRequest;
import com.naodab.profileservice.dto.request.UploadAvatarRequest;
import com.naodab.profileservice.dto.response.ProfileResponse;
import com.naodab.profileservice.entities.Profile;
import com.naodab.profileservice.dto.event.ProfileLinkedToAccountEvent;
import com.naodab.profileservice.kafka.producers.ProfileLinkedToAccountProducer;
import com.naodab.profileservice.mappers.ProfileMapper;
import com.naodab.profileservice.repositories.ProfileRepository;
import com.naodab.profileservice.services.ProfileService;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class ProfileServiceImpl implements ProfileService {
  ProfileRepository profileRepository;
  ProfileMapper profileMapper;
  ProfileLinkedToAccountProducer profileLinkedToAccountProducer;

  @Override
  public ProfileResponse createProfile(ProfileCreateRequest request) {
    Profile profile = profileMapper.toProfile(request);

    if (profile == null) {
      log.error("Failed to map ProfileCreateRequest to Profile");
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
    }

    if (profileRepository.existsByEmail(profile.getEmail())) {
      log.error("Profile with email {} already exists", profile.getEmail());
      throw new AppException(ErrorCode.PROFILE_ALREADY_EXISTS);
    }

    profile = profileRepository.save(profile);
    publishProfileLinkedToAccount(profile);

    return profileMapper.toProfileResponse(profile);
  }

  @Override
  public List<ProfileResponse> getAllProfiles(int page, int pageSize) {
    Pageable pageable = PageRequest.of(
        page,
        pageSize,
        Sort.by(Sort.Direction.DESC, "createdAt"));

    return profileRepository.findByDeletedAtIsNull(pageable)
        .stream()
        .map(profileMapper::toProfileResponse)
        .toList();
  }

  @Override
  public ProfileResponse getProfileById(String id) {
    if (id == null || id.isBlank()) {
      log.error("Profile id is null or blank");
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
    }

    return profileRepository.findById(id)
        .map(profileMapper::toProfileResponse)
        .orElseThrow(() -> new AppException(ErrorCode.PROFILE_NOT_FOUND));
  }

  @Override
  public ProfileResponse getProfileByEmail(String email) {
    if (email == null || email.isBlank()) {
      log.error("Email is null or blank");
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
    }

    return profileRepository.findByEmail(email)
        .map(profileMapper::toProfileResponse)
        .orElseThrow(() -> new AppException(ErrorCode.PROFILE_NOT_FOUND));
  }

  @Override
  public ProfileResponse updateProfile(String id, ProfileUpdateRequest request) {
    if (id == null || id.isBlank()) {
      log.error("Profile id is null or blank");
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
    }

    return profileRepository.findById(id)
        .map(profile -> profileMapper.toProfile(profile, request))
        .map(profileRepository::save)
        .map(profileMapper::toProfileResponse)
        .orElseThrow(() -> new AppException(ErrorCode.PROFILE_NOT_FOUND));
  }

  @Override
  public void deleteProfile(String id) {
    if (id == null || id.isBlank())
      return;

    profileRepository.deleteById(id);
  }

  @Override
  public void createProfileFromEvent(CreateProfileEvent event) {
    if (event == null)
      return;

    if (!StringUtils.hasText(event.getEmail())) {
      log.warn("Skip create profile from event because email is empty");
      return;
    }

    if (profileRepository.existsByEmail(event.getEmail())) {
      profileRepository.findByEmail(event.getEmail()).ifPresent(this::publishProfileLinkedToAccount);
      log.debug("Profile already exists for email {}, re-publishing profile link event", event.getEmail());
      return;
    }

    Profile profile = profileMapper.toProfile(event);
    profile = profileRepository.save(profile);
    publishProfileLinkedToAccount(profile);
  }

  private void publishProfileLinkedToAccount(Profile profile) {
    if (profile == null || profile.getEmail() == null || profile.getId() == null) {
      return;
    }
    profileLinkedToAccountProducer.send(ProfileLinkedToAccountEvent.builder()
        .email(profile.getEmail())
        .profileId(profile.getId())
        .build());
  }

  @Override
  @Transactional
  public void uploadAvatarFromEvent(UploadAvatarRequest request) {
    if (request == null)
      return;

    if (request.getProfileId() == null || request.getProfileId().isBlank()) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }

    if (!StringUtils.hasText(request.getAvatarUrl())) {
      log.error("Avatar URL is null or blank");
      throw new AppException(ErrorCode.AVATAR_IS_NULL);
    }

    profileRepository.findById(request.getProfileId())
        .ifPresent(profile -> {
          profile.setAvatarUrl(request.getAvatarUrl().trim());
          profileRepository.save(profile);
        });
  }

  @Override
  public ProfileResponse updateProfileByEmail(String email, ProfileUpdateRequest request) {
    if (email == null || email.isBlank()) {
      log.error("Email is null or blank");
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
    }

    return profileRepository.findByEmail(email)
        .map(profile -> profileMapper.toProfile(profile, request))
        .map(profileRepository::save)
        .map(profileMapper::toProfileResponse)
        .orElseThrow(() -> new AppException(ErrorCode.PROFILE_NOT_FOUND));
  }
}
