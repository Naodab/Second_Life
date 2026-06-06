package com.naodab.mailservice.repositories;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.naodab.mailservice.models.MessageDocument;

public interface MessageRepository extends MongoRepository<MessageDocument, String> {

  List<MessageDocument> findByConversationIdOrderByCreatedAtDesc(
      String conversationId, Pageable pageable);
}
