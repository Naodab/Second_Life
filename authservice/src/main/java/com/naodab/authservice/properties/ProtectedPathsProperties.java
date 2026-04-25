package com.naodab.authservice.properties;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "protected-paths")
public class ProtectedPathsProperties {

  private List<String> post;
  private List<String> put;
  private List<String> delete;

  private Map<String, List<String>> byMethod = Map.of();

  @PostConstruct
  void materialize() {
    Map<String, List<String>> m = new LinkedHashMap<>();
    putIfPresent(m, "POST", post);
    putIfPresent(m, "PUT", put);
    putIfPresent(m, "DELETE", delete);
    byMethod = Collections.unmodifiableMap(m);
  }

  private static void putIfPresent(Map<String, List<String>> target, String method, List<String> paths) {
    if (paths != null && !paths.isEmpty()) {
      target.put(method, paths);
    }
  }
}
