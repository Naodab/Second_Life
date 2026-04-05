package com.naodab.locationservice.models;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Index;
import lombok.Getter;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "wards", indexes = {
    @Index(name = "idx_province_code", columnList = "province_code"),
    @Index(name = "idx_administrative_unit_id", columnList = "administrative_unit_id"),
    @Index(name = "idx_code", columnList = "code")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class Ward {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  Integer id;

  String code;
  String name;
  String nameEn;
  String fullName;
  String fullNameEn;
  String codeName;

  @ManyToOne
  @JoinColumn(name = "province_code", referencedColumnName = "code", nullable = false)
  Province province;

  @ManyToOne
  @JoinColumn(name = "administrative_unit_id")
  AdministrativeUnit administrativeUnit;
}
