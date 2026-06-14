package com.naodab.productservice.initializers;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

import org.springframework.stereotype.Component;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.naodab.productservice.models.Attribute;
import com.naodab.productservice.models.AttributeValue;
import com.naodab.productservice.repositories.AttributeRepository;

import jakarta.transaction.Transactional;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AttributeSeedBootstrap {
  private static final ObjectMapper YAML_MAPPER = new ObjectMapper(new YAMLFactory());
  AttributeRepository attributeRepository;

  @Transactional
  public void seedIfEmpty() {
    try {
      List<AttributeSeed> seeds = loadSeeds();
      if (seeds.isEmpty()) {
        return;
      }

      if (attributeRepository.count() == 0) {
        for (AttributeSeed seed : seeds) {
          attributeRepository.save(seed.toAttribute());
        }
        log.info("Attributes initialized successfully ({} items)", seeds.size());
        return;
      }

      int added = 0;
      int updated = 0;
      for (AttributeSeed seed : seeds) {
        if (seed.getId() == null) {
          continue;
        }
        Optional<Attribute> existing = attributeRepository.findById(seed.getId());
        if (existing.isEmpty()) {
          attributeRepository.save(seed.toAttribute());
          added++;
          continue;
        }
        if (syncFromSeed(existing.get(), seed)) {
          attributeRepository.save(existing.get());
          updated++;
        }
      }
      if (added > 0 || updated > 0) {
        log.info("Attribute seed sync: {} added, {} updated", added, updated);
      } else {
        log.info("Attributes already up to date with seed");
      }
    } catch (Exception e) {
      log.error("Error initializing attributes", e);
      throw new IllegalStateException("Attribute seed failed", e);
    }
  }

  static boolean syncFromSeed(Attribute attribute, AttributeSeed seed) {
    boolean changed = false;

    if (syncSubCategoryIds(attribute, seed.getSubCategoryIds())) {
      changed = true;
    }

    if (seed.getAttributeValues() != null) {
      for (AttributeValueSeed valueSeed : seed.getAttributeValues()) {
        if (valueSeed.getId() == null) {
          continue;
        }
        Optional<AttributeValue> existingValue = attribute.getAttributeValues().stream()
            .filter(value -> valueSeed.getId().equals(value.getId()))
            .findFirst();
        if (existingValue.isEmpty()) {
          attribute.addAttributeValue(toAttributeValue(valueSeed));
          changed = true;
          continue;
        }
        if (syncAttributeValue(existingValue.get(), valueSeed)) {
          changed = true;
        }
      }
    }

    return changed;
  }

  private static boolean syncSubCategoryIds(Attribute attribute, List<String> seedSubCategoryIds) {
    List<String> desired = seedSubCategoryIds == null ? List.of() : List.copyOf(seedSubCategoryIds);
    List<String> current = attribute.getSubCategoryIds() == null ? List.of() : attribute.getSubCategoryIds();
    if (current.equals(desired)) {
      return false;
    }
    if (attribute.getSubCategoryIds() == null) {
      attribute.setSubCategoryIds(new ArrayList<>(desired));
    } else {
      attribute.getSubCategoryIds().clear();
      attribute.getSubCategoryIds().addAll(desired);
    }
    return true;
  }

  private static boolean syncAttributeValue(AttributeValue existing, AttributeValueSeed seed) {
    boolean changed = false;
    if (seed.getValue() != null && !Objects.equals(seed.getValue(), existing.getValue())) {
      existing.setValue(seed.getValue());
      changed = true;
    }
    if (seed.getCode() != null && !Objects.equals(seed.getCode(), existing.getCode())) {
      existing.setCode(seed.getCode());
      changed = true;
    }
    return changed;
  }

  private static AttributeValue toAttributeValue(AttributeValueSeed seed) {
    return AttributeValue.builder()
        .id(seed.id)
        .value(seed.value)
        .code(seed.code)
        .build();
  }

  private List<AttributeSeed> loadSeeds() throws java.io.IOException {
    Resource resource = new ClassPathResource("data/attributes-seed.yml");
    InputStream inputStream = resource.getInputStream();
    List<AttributeSeed> attributes = YAML_MAPPER.readValue(inputStream,
        new TypeReference<Map<String, List<AttributeSeed>>>() {
        }).get("attributes");
    if (attributes == null) {
      log.warn("attributes-seed.yml has no 'attributes' list");
      return List.of();
    }
    return attributes;
  }

  @Getter
  @Setter
  @FieldDefaults(level = lombok.AccessLevel.PRIVATE)
  public static class AttributeSeed {
    String id;
    String name;
    List<String> subCategoryIds;
    List<AttributeValueSeed> attributeValues;

    public Attribute toAttribute() {
      Attribute attribute = Attribute.builder()
          .id(id)
          .name(name)
          .subCategoryIds(subCategoryIds == null ? new ArrayList<>() : new ArrayList<>(subCategoryIds))
          .attributeValues(new ArrayList<>())
          .build();

      if (attributeValues != null) {
        for (AttributeValueSeed seed : attributeValues) {
          attribute.addAttributeValue(toAttributeValue(seed));
        }
      }

      return attribute;
    }
  }

  @Getter
  @Setter
  @FieldDefaults(level = lombok.AccessLevel.PRIVATE)
  public static class AttributeValueSeed {
    String id;
    String value;
    String code;
  }
}
