package com.naodab.productservice.models;

import com.naodab.commonjpa.entity.BaseEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Index;

@Entity
@Table(name = "facilities", indexes = {
    @Index(name = "idx_owner_id", columnList = "owner_id"),
    @Index(name = "idx_province_code", columnList = "province_code"),
    @Index(name = "idx_ward_code", columnList = "ward_code"),
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class Facility extends BaseEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  String id;

  String name;
  String ownerId;
  String description;
  String imageUrl;

  String linkGoogleMap;
  String address;
  String provinceCode;
  String wardCode;
  Float latitude;
  Float longitude;

  Long viewCount;
  Long orderCount;
  Float averageRating;
}
