package com.naodab.productservice.initializers;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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
    if (attributeRepository.count() > 0) {
      log.info("Attributes already initialized");
      return;
    }

    try {
      Resource resource = new ClassPathResource("data/attributes-seed.yml");
      InputStream inputStream = resource.getInputStream();

      List<AttributeSeed> attributes = YAML_MAPPER.readValue(inputStream,
          new TypeReference<Map<String, List<AttributeSeed>>>() {
          }).get("attributes");

      if (attributes == null) {
        log.warn("attributes-seed.yml has no 'attributes' list");
        return;
      }

      for (AttributeSeed seed : attributes) {
        Attribute attribute = seed.toAttribute();
        attributeRepository.save(attribute);
      }

      log.info("Attributes initialized successfully");
    } catch (Exception e) {
      log.error("Error initializing attributes", e);
      throw new RuntimeException("Attribute seed failed", e);
    }
  }

  @Getter
  @Setter
  @FieldDefaults(level = lombok.AccessLevel.PRIVATE)
  public static class AttributeSeed {
    String id;
    String name;
    List<AttributeValueSeed> attributeValues;

    public Attribute toAttribute() {
      Attribute attribute = Attribute.builder()
          .id(id)
          .name(name)
          .attributeValues(new ArrayList<>())
          .build();

      if (attributeValues != null) {
        for (AttributeValueSeed seed : attributeValues) {
          AttributeValue attributeValue = AttributeValue.builder()
              .id(seed.id)
              .value(seed.value)
              .build();
          attribute.addAttributeValue(attributeValue);
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
  }
}
