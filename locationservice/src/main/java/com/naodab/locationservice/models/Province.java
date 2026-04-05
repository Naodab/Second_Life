package com.naodab.locationservice.models;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "provinces", indexes = {
    @Index(name = "idx_administrative_unit_id", columnList = "administrative_unit_id"),
    @Index(name = "idx_code", columnList = "code")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class Province {
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
  @JoinColumn(name = "administrative_unit_id", nullable = false)
  AdministrativeUnit administrativeUnit;
}
