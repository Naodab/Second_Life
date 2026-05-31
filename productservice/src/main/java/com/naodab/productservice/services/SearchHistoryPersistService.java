package com.naodab.productservice.services;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.naodab.productservice.dto.search.SearchHistorySnapshot;
import com.naodab.productservice.dto.request.ListingSearchRequest;
import com.naodab.productservice.models.SearchHistories;
import com.naodab.productservice.repositories.SearchHistoriesRepository;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SearchHistoryPersistService {

  static final int MAX_SNAPSHOTS = 5;

  static final TypeReference<ArrayList<SearchHistorySnapshot>> SNAPSHOT_LIST_TYPE = new TypeReference<>() {
  };

  SearchHistoriesRepository searchHistoriesRepository;
  ObjectMapper objectMapper;

  @Transactional
  public void appendSnapshot(String profileId, ListingSearchRequest normalizedSearch) {
    if (!StringUtils.hasText(profileId) || normalizedSearch == null) {
      return;
    }
    String pid = profileId.trim();
    SearchHistorySnapshot snapshot = SearchHistorySnapshot.fromNormalizedSearch(normalizedSearch);
    if (!snapshot.isWorthRecording()) {
      return;
    }

    SearchHistories row = searchHistoriesRepository.findByProfileIdForUpdate(pid).orElseGet(
        () -> SearchHistories.builder().profileId(pid).entriesJson("[]").build());
    List<SearchHistorySnapshot> list = readSnapshots(row.getEntriesJson());
    if (!list.isEmpty() && list.get(0).contentEquals(snapshot)) {
      return;
    }
    list.add(0, snapshot);
    while (list.size() > MAX_SNAPSHOTS) {
      list.remove(list.size() - 1);
    }
    try {
      row.setEntriesJson(objectMapper.writeValueAsString(list));
    } catch (JsonProcessingException e) {
      throw new IllegalStateException("search history serialization failed", e);
    }
    searchHistoriesRepository.save(row);
  }

  public List<SearchHistorySnapshot> loadSnapshotsOrderedNewestFirst(String profileId) {
    if (!StringUtils.hasText(profileId)) {
      return List.of();
    }
    return searchHistoriesRepository
        .findByProfileId(profileId.trim())
        .map(SearchHistories::getEntriesJson)
        .map(this::readSnapshots)
        .orElseGet(List::of);
  }

  private List<SearchHistorySnapshot> readSnapshots(String json) {
    if (!StringUtils.hasText(json)) {
      return new ArrayList<>();
    }
    try {
      ArrayList<SearchHistorySnapshot> parsed = objectMapper.readValue(json.trim(), SNAPSHOT_LIST_TYPE);
      return parsed == null ? new ArrayList<>() : parsed;
    } catch (Exception e) {
      return new ArrayList<>();
    }
  }
}
