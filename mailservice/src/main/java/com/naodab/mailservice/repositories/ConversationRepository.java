package com.naodab.mailservice.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.naodab.mailservice.models.ConversationDocument;
import com.naodab.mailservice.models.ConversationType;

public interface ConversationRepository extends MongoRepository<ConversationDocument, String> {

  List<ConversationDocument> findByBuyerProfileIdAndConversationTypeNotOrderByLastMessageAtDesc(
      String buyerProfileId, ConversationType conversationType, Pageable pageable);

  List<ConversationDocument> findBySellerProfileIdAndConversationTypeNotOrderByLastMessageAtDesc(
      String sellerProfileId, ConversationType conversationType, Pageable pageable);

  List<ConversationDocument> findByBuyerProfileIdAndConversationTypeOrderByLastMessageAtDesc(
      String buyerProfileId, ConversationType conversationType, Pageable pageable);

  List<ConversationDocument> findByConversationTypeOrderByLastMessageAtDesc(
      ConversationType conversationType, Pageable pageable);

  List<ConversationDocument> findByBuyerProfileIdOrderByLastMessageAtDesc(
      String buyerProfileId, Pageable pageable);

  List<ConversationDocument> findBySellerProfileIdOrderByLastMessageAtDesc(
      String sellerProfileId, Pageable pageable);

  Optional<ConversationDocument> findByBuyerProfileIdAndFacilityId(
      String buyerProfileId, String facilityId);

  Optional<ConversationDocument> findByIdAndBuyerProfileId(String id, String buyerProfileId);

  Optional<ConversationDocument> findByIdAndSellerProfileId(String id, String sellerProfileId);
}
