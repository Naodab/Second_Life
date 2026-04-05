package com.naodab.locationservice.models;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "administrative_units")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class AdministrativeUnit {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  Integer id;

  String fullName;
  String fullNameEn;
  String shortName;
  String shortNameEn;
  String codeName;
  String codeNameEn;
}
