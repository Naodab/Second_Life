package com.naodab.productservice.models;

import org.springframework.data.domain.Persistable;

import com.naodab.commonjpa.entity.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.Transient;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@MappedSuperclass
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public abstract class CatalogItemBase extends BaseEntity implements Persistable<String> {
  @Id
  String id;

  @Transient
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

  @Column(name = "code", length = 64, unique = true)
  String code;
}
