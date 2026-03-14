package com.naodab.authservice.models;

import org.hibernate.annotations.SQLDelete;

import com.naodab.commonjpa.entity.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
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
@Table(
  name = "accounts",
  indexes = {
    @Index(name = "idx_email", columnList = "email", unique = true),
    @Index(name = "idx_provider_id", columnList = "provider_id")
  }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE accounts SET deleted_at = NOW() WHERE id = ?")
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class Account extends BaseEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  String id;

  @Column(nullable = false, unique = true)
  String email;
  String password;

  @Enumerated(EnumType.STRING)
  @Builder.Default
  AuthProvider authProvider = AuthProvider.LOCAL;

  @Column(nullable = true, name = "provider_id")
  String providerId;

  @Enumerated(EnumType.STRING)
  @Builder.Default
  @Column(nullable = false)
  Role role = Role.USER;

  @Builder.Default
  @Column(name = "email_verified", nullable = false)
  Boolean emailVerified = false;

  @Column(name = "refresh_token")
  String refreshToken;

  @Builder.Default
  @Column(nullable = false, name = "is_active")
  Boolean active = true;

  public enum Role {
    USER, ADMIN
  }
}
