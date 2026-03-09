package com.naodab.profileservice.mappers;

import org.springframework.stereotype.Component;

import com.naodab.profileservice.dto.request.ProfileCreateRequest;
import com.naodab.profileservice.dto.request.ProfileUpdateRequest;
import com.naodab.profileservice.dto.response.ProfileResponse;
import com.naodab.profileservice.entities.Profile;

@Component
public class ProfileMapper {
  public ProfileResponse toProfileResponse(Profile profile) {
    if (profile == null) {
      return null;
    }

    return new ProfileResponse(
        profile.getId(),
        profile.getEmail(),
        profile.getPhoneNumber(),
        profile.getFirstName(),
        profile.getLastName(),
        profile.getAvatarUrl(),
        profile.getRole(),
        profile.getStatus(),
        profile.getCreatedAt(),
        profile.getUpdatedAt(),
        profile.getDeletedAt()
    );
  }

  public Profile toProfile(ProfileCreateRequest profileCreateRequest) {
    if (profileCreateRequest == null) {
      return null;
    }

    Profile profile = new Profile();
    profile.setEmail(profileCreateRequest.getEmail());
    profile.setPhoneNumber(profileCreateRequest.getPhoneNumber());
    profile.setFirstName(profileCreateRequest.getFirstName());
    profile.setLastName(profileCreateRequest.getLastName());

    return profile;
  }

  public Profile toProfile(Profile profile, ProfileUpdateRequest profileUpdateRequest) {
    if (profile == null || profileUpdateRequest == null) {
      return profile;
    }

    if (profileUpdateRequest.getPhoneNumber() != null) {
      profile.setPhoneNumber(profileUpdateRequest.getPhoneNumber());
    }

    if (profileUpdateRequest.getFirstName() != null) {
      profile.setFirstName(profileUpdateRequest.getFirstName());
    }

    if (profileUpdateRequest.getLastName() != null) {
      profile.setLastName(profileUpdateRequest.getLastName());
    }

    if (profileUpdateRequest.getAvatarUrl() != null) {
      profile.setAvatarUrl(profileUpdateRequest.getAvatarUrl());
    }

    return profile;
  }
}
