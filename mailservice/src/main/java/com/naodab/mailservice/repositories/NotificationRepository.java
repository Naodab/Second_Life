package com.naodab.mailservice.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.naodab.mailservice.models.NotificationDocument;

public interface NotificationRepository extends MongoRepository<NotificationDocument, String> {

  List<NotificationDocument> findByProfileIdOrderByCreatedAtDesc(String profileId, Pageable pageable);

  long countByProfileIdAndReadFalse(String profileId);

  Optional<NotificationDocument> findByIdAndProfileId(String id, String profileId);

  List<NotificationDocument> findByProfileIdAndReadFalse(String profileId);
}
