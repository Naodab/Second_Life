package com.naodab.mailservice.service;

import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

@Component
public class NotificationWebSocketSessionRegistry {

  private final ConcurrentHashMap<String, Set<WebSocketSession>> sessionsByProfileId =
      new ConcurrentHashMap<>();

  public void register(String profileId, WebSocketSession session) {
    sessionsByProfileId
        .computeIfAbsent(profileId, ignored -> ConcurrentHashMap.newKeySet())
        .add(session);
  }

  public void unregister(WebSocketSession session) {
    sessionsByProfileId.values().forEach(set -> set.remove(session));
    sessionsByProfileId.entrySet().removeIf(entry -> entry.getValue().isEmpty());
  }

  public Set<WebSocketSession> sessionsFor(String profileId) {
    return sessionsByProfileId.getOrDefault(profileId, Set.of());
  }
}
