package com.naodab.profileservice.entities;

import org.hibernate.annotations.SQLDelete;

import com.naodab.commonjpa.entity.BaseEntity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import jakarta.persistence.Index;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "bank_accounts", indexes = {
    @Index(name = "idx_profile_id", columnList = "profile_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE bank_accounts SET deleted_at = NOW() WHERE id = ?")
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class BankAccount extends BaseEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  String id;

  @ManyToOne
  @JoinColumn(name = "bank_id")
  Bank bank;

  @ManyToOne
  @JoinColumn(name = "profile_id")
  Profile profile;

  String accountNumber;
  String accountName;
  String qrCodeUrl;
}
