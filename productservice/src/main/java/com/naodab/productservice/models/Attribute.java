package com.naodab.productservice.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.OneToMany;
import jakarta.persistence.CascadeType;

import java.util.List;

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
public class Attribute extends BaseEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  String id;

  @Column(name = "name", nullable = false, unique = true)
  String name;

  @OneToMany(mappedBy = "attribute", cascade = CascadeType.ALL, orphanRemoval = true)
  List<AttributeValue> attributeValues;

  public void addAttributeValue(AttributeValue attributeValue) {
    attributeValues.add(attributeValue);
  }

  public void removeAttributeValue(AttributeValue attributeValue) {
    attributeValues.remove(attributeValue);
  }

  public void addAttributeValues(List<AttributeValue> attributeValues) {
    this.attributeValues.addAll(attributeValues);
  }

  public void removeAttributeValues(List<AttributeValue> attributeValues) {
    this.attributeValues.removeAll(attributeValues);
  }
}
