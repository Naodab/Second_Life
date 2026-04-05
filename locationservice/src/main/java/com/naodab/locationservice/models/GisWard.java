package com.naodab.locationservice.models;

import java.math.BigDecimal;

import org.locationtech.jts.geom.MultiPolygon;
import org.locationtech.jts.geom.Polygon;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "gis_wards", indexes = {
    @Index(name = "idx_ward_code", columnList = "ward_code")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class GisWard {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  Integer id;

  @OneToOne
  @JoinColumn(name = "ward_code", referencedColumnName = "code", nullable = false)
  Ward ward;

  String gisServerId;

  BigDecimal areaKm2;

  @Column(name = "bbox", nullable = false, columnDefinition = "POLYGON NOT NULL SRID 4326")
  Polygon bbox;

  @Column(name = "geom", nullable = false, columnDefinition = "MULTIPOLYGON NOT NULL SRID 4326")
  MultiPolygon geom;
}
