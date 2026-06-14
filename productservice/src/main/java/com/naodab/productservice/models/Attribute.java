package com.naodab.productservice.models;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

import java.util.ArrayList;
import java.util.List;
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
@Table(name = "attributes")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class Attribute extends BaseEntity implements Persistable<String> {
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

  @Column(name = "name", nullable = false, unique = true)
  String name;

  /** Empty = áp dụng mọi danh mục con; có giá trị = chỉ hiện khi chọn sub-category tương ứng. */
  @Builder.Default
  @ElementCollection(fetch = FetchType.EAGER)
  @CollectionTable(
      name = "attribute_sub_categories",
      joinColumns = @JoinColumn(name = "attribute_id"))
  @Column(name = "sub_category_id")
  List<String> subCategoryIds = new ArrayList<>();

  @Builder.Default
  @OneToMany(mappedBy = "attribute", cascade = CascadeType.ALL, orphanRemoval = true)
  List<AttributeValue> attributeValues = new ArrayList<>();

  public void addAttributeValue(AttributeValue attributeValue) {
    attributeValue.setAttribute(this);
    attributeValues.add(attributeValue);
  }

  public void removeAttributeValue(AttributeValue attributeValue) {
    attributeValue.setAttribute(null);
    attributeValues.remove(attributeValue);
  }

  public void addAttributeValues(List<AttributeValue> attributeValues) {
    for (AttributeValue attributeValue : attributeValues) {
      addAttributeValue(attributeValue);
    }
  }

  public void removeAttributeValues(List<AttributeValue> attributeValues) {
    for (AttributeValue attributeValue : attributeValues) {
      removeAttributeValue(attributeValue);
    }
  }
}
