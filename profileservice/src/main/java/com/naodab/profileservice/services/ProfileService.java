package com.naodab.profileservice.services;

import java.util.List;

import com.naodab.profileservice.dto.event.CreateProfileEvent;
import com.naodab.profileservice.dto.request.ProfileCreateRequest;
import com.naodab.profileservice.dto.request.ProfileUpdateRequest;
import com.naodab.profileservice.dto.request.UploadAvatarRequest;
import com.naodab.profileservice.dto.response.ProfileResponse;

public interface ProfileService {
  ProfileResponse createProfile(ProfileCreateRequest request);

  List<ProfileResponse> getAllProfiles(int page, int pageSize);

  ProfileResponse getProfileById(String id);

  ProfileResponse getProfileByEmail(String email);

  ProfileResponse updateProfile(String id, ProfileUpdateRequest request);

  ProfileResponse updateProfileByEmail(String email, ProfileUpdateRequest request);

  void deleteProfile(String id);

  void createProfileFromEvent(CreateProfileEvent event);

  void uploadAvatarFromEvent(UploadAvatarRequest event);
}
