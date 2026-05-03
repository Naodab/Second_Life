package com.naodab.productservice.services;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.naodab.productservice.dto.request.ListingSearchRequest;

import lombok.RequiredArgsConstructor;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SearchHistoryAsyncRecorder {

  SearchHistoryPersistService searchHistoryPersistService;

  @Async
  public void recordListingSearchAsync(String rawProfileId, ListingSearchRequest normalizedRequest) {
    if (!StringUtils.hasText(rawProfileId) || normalizedRequest == null) {
      return;
    }
    String profileId = rawProfileId.trim();
    try {
      searchHistoryPersistService.appendSnapshot(profileId, normalizedRequest);
    } catch (Exception e) {
      log.warn("Async search history update failed profileId={}", profileId, e);
    }
  }
}
