package com.naodab.productservice.initializers;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.naodab.productservice.models.Category;
import com.naodab.productservice.models.SubCategory;
import com.naodab.productservice.repositories.CategoryRepository;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class CategorySeedBootstrap {
  private static final ObjectMapper YAML_MAPPER = new ObjectMapper(new YAMLFactory());

  CategoryRepository categoryRepository;

  @Transactional
  public void seedIfEmpty() {
    if (categoryRepository.count() > 0) {
      log.info("Categories already initialized");
      return;
    }

    try {
      Resource resource = new ClassPathResource("data/categories-seed.yml");
      InputStream inputStream = resource.getInputStream();

      List<CategorySeed> categories = YAML_MAPPER.readValue(inputStream,
          new TypeReference<Map<String, List<CategorySeed>>>() {
          }).get("categories");

      if (categories == null) {
        log.warn("categories-seed.yml has no 'categories' list");
        return;
      }

      for (CategorySeed seed : categories) {
        Category category = seed.toCategory();
        List<SubCategory> children = new ArrayList<>();
        if (seed.getSubCategories() != null) {
          for (SubCategorySeed subSeed : seed.getSubCategories()) {
            SubCategory sub = subSeed.toSubCategory();
            sub.setCategory(category);
            children.add(sub);
          }
        }
        category.setSubCategories(children);
        categoryRepository.save(category);
      }

      log.info("Categories initialized successfully");
    } catch (Exception e) {
      log.error("Error initializing categories", e);
      throw new RuntimeException("Category seed failed", e);
    }
  }

  @Getter
  @Setter
  @FieldDefaults(level = lombok.AccessLevel.PRIVATE)
  public static class CategorySeed {
    String id;
    String name;
    String nameEn;
    String description;
    String descriptionEn;
    String code;
    List<SubCategorySeed> subCategories;

    public Category toCategory() {
      return Category.builder()
          .id(id)
          .name(name)
          .nameEn(nameEn)
          .description(description)
          .descriptionEn(descriptionEn)
          .code(code)
          .build();
    }
  }

  @Getter
  @Setter
  @FieldDefaults(level = lombok.AccessLevel.PRIVATE)
  public static class SubCategorySeed {
    String id;
    String name;
    String nameEn;
    String description;
    String descriptionEn;
    String code;

    public SubCategory toSubCategory() {
      return SubCategory.builder()
          .id(id)
          .name(name)
          .nameEn(nameEn)
          .description(description)
          .descriptionEn(descriptionEn)
          .code(code)
          .build();
    }
  }
}
