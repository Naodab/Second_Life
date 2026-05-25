package com.naodab.productservice.models;

import com.naodab.commonjpa.entity.BaseEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Index;
import jakarta.persistence.OneToMany;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "facilities", indexes = {
    @Index(name = "idx_owner_id", columnList = "owner_id"),
    @Index(name = "idx_province_code", columnList = "province_code"),
    @Index(name = "idx_ward_code", columnList = "ward_code"),
})
@Getter
@Setter
@Builder
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

  @Column(length = 4096)
  String linkGoogleMap;
  String address;
  String provinceCode;
  String wardCode;

  @Column(length = 255)
  String email;

  @Column(length = 32)
  String phoneNumber;
  Float latitude;
  Float longitude;

  @Builder.Default
  Boolean isActive = true;

  @Builder.Default
  Long viewCount = 0L;

  @Builder.Default
  Long orderCount = 0L;

  @Builder.Default
  Float averageRating = 0.0F;

  @OneToMany(mappedBy = "facility")
  @Builder.Default
  List<Listing> listings = new ArrayList<>();
}
