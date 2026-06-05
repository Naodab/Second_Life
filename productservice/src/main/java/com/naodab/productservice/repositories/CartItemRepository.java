package com.naodab.productservice.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.naodab.productservice.models.CartItem;

public interface CartItemRepository extends JpaRepository<CartItem, String> {

  List<CartItem> findByProfileIdAndDeletedAtIsNullOrderByCreatedAtDesc(String profileId);

  Optional<CartItem> findByIdAndProfileIdAndDeletedAtIsNull(String id, String profileId);

  void deleteByProfileIdAndDeletedAtIsNull(String profileId);
}
