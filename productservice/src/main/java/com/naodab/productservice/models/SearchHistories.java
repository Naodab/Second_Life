package com.naodab.productservice.models;

import com.naodab.commonjpa.entity.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "search_histories")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SearchHistories extends BaseEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  String id;

  @Column(name = "profile_id", nullable = false, unique = true, length = 64)
  String profileId;

  @Column(name = "entries_json", nullable = false, columnDefinition = "LONGTEXT")
  String entriesJson;
}
