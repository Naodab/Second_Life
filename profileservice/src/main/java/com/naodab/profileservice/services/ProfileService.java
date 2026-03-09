package com.naodab.profileservice.services;

import java.util.List;

import com.naodab.profileservice.dto.request.ProfileCreateRequest;
import com.naodab.profileservice.dto.request.ProfileUpdateRequest;
import com.naodab.profileservice.dto.response.ProfileResponse;

public interface ProfileService {
  ProfileResponse createProfile(ProfileCreateRequest request);
  List<ProfileResponse> getAllProfiles(int page, int pageSize);
  ProfileResponse getProfileById(String id);
  ProfileResponse getProfileByEmail(String email);
  ProfileResponse updateProfile(String id, ProfileUpdateRequest request);
  void deleteProfile(String id);
}
