package com.naodab.authservice.models;

import org.hibernate.annotations.SQLDelete;

import com.naodab.commonjpa.entity.BaseEntity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(
  name = "accounts",
  indexes = {
    @Index(name = "idx_email", columnList = "email", unique = true)
  }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE accounts SET deleted_at = NOW() WHERE id = ?")
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class Account extends BaseEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  String id;
  String email;
  String password;
}
