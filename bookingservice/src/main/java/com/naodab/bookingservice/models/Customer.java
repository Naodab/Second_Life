package com.naodab.bookingservice.models;

import com.naodab.commonjpa.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "customers", indexes = {
    @Index(name = "idx_customers_profile_id", columnList = "profile_id"),
    @Index(name = "idx_customers_province_code", columnList = "province_code"),
    @Index(name = "idx_customers_ward_code", columnList = "ward_code"),
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class Customer extends BaseEntity {
  @Id
  String id;

  String profileId;

  String firstName;

  String lastName;

  String phoneNumber;

  String email;

  String address;

  String provinceCode;

  String wardCode;

  @Column(name = "is_default", nullable = false)
  @Builder.Default
  boolean isDefault = false;
}
