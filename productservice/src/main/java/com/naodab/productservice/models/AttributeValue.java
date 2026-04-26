package com.naodab.productservice.models;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Index;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Transient;

import java.util.UUID;

import org.springframework.data.domain.Persistable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import com.naodab.commonjpa.entity.BaseEntity;

@Entity
@Table(name = "attribute_values", indexes = {
    @Index(name = "idx_attribute_id", columnList = "attribute_id"),
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class AttributeValue extends BaseEntity implements Persistable<String> {
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

  @PrePersist
  void ensureId() {
    if (id == null || id.isBlank()) {
      id = UUID.randomUUID().toString();
    }
  }

  @ManyToOne
  @JoinColumn(name = "attribute_id", nullable = false)
  Attribute attribute;

  String value;
}
