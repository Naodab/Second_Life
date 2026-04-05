package com.naodab.profileservice.entities;

import org.hibernate.annotations.SQLDelete;

import com.naodab.commonjpa.entity.BaseEntity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "banks")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE banks SET deleted_at = NOW() WHERE id = ?")
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class Bank extends BaseEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  String id;

  String name;
  String code;
  String logoUrl;
}
