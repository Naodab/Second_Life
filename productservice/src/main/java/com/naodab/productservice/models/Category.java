package com.naodab.productservice.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.OneToMany;
import jakarta.persistence.CascadeType;
import jakarta.persistence.OrderBy;

import java.util.List;

import org.springframework.data.domain.Persistable;

import com.naodab.commonjpa.entity.BaseEntity;

import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.Transient;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "categories")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class Category extends BaseEntity implements Persistable<String> {
  @Id
  String id;

  @Transient
  @Builder.Default
  boolean persisted = false;

  @PostLoad
  @PostPersist
  void markPersisted() {
    this.persisted = true;
  }

  @Override
  public boolean isNew() {
    return !persisted;
  }

  @Column(name = "name", length = 255, nullable = false)
  String name;

  @Column(name = "name_en", length = 255)
  String nameEn;

  @Column(name = "description", length = 1000)
  String description;

  @Column(name = "description_en", length = 1000)
  String descriptionEn;

  @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, orphanRemoval = true)
  @OrderBy("name ASC")
  List<SubCategory> subCategories;
}
