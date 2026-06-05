package com.naodab.mailservice.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import com.naodab.mailservice.websocket.NotificationHandshakeInterceptor;
import com.naodab.mailservice.websocket.NotificationWebSocketHandler;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class WebSocketConfig implements WebSocketConfigurer {

  NotificationWebSocketHandler notificationWebSocketHandler;
  NotificationHandshakeInterceptor notificationHandshakeInterceptor;

  @NonFinal
  @Value("${external.cors_allowed_origins:http://localhost:5173,http://localhost}")
  String corsAllowedOrigins;

  @Override
  public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
    List<String> origins = Arrays.stream(corsAllowedOrigins.split(","))
        .map(String::trim)
        .filter(s -> !s.isEmpty())
        .toList();
    registry
        .addHandler(notificationWebSocketHandler, "/ws/notifications")
        .addInterceptors(notificationHandshakeInterceptor)
        .setAllowedOrigins(origins.toArray(new String[0]));
  }
}
