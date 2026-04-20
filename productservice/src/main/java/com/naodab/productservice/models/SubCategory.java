package com.naodab.productservice.models;

import org.springframework.data.domain.Persistable;

import com.naodab.commonjpa.entity.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Index;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "sub_categories", indexes = {
    @Index(name = "idx_category_id", columnList = "category_id"),
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class SubCategory extends BaseEntity implements Persistable<String> {
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

  @ManyToOne
  @JoinColumn(name = "category_id", nullable = false)
  Category category;
}
