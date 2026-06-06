package com.naodab.mailservice.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.mailservice.clients.ProductClients;
import com.naodab.mailservice.dto.CreateConversationRequest;
import com.naodab.mailservice.dto.FacilitySummary;
import com.naodab.mailservice.dto.SendMessageRequest;
import com.naodab.mailservice.models.ConversationDocument;
import com.naodab.mailservice.models.MessageDocument;
import com.naodab.mailservice.repositories.ConversationRepository;
import com.naodab.mailservice.repositories.MessageRepository;

@ExtendWith(MockitoExtension.class)
class ConversationServiceTest {

  @Mock
  ConversationRepository conversationRepository;
  @Mock
  MessageRepository messageRepository;
  @Mock
  ProductClients productClients;
  @Mock
  NotificationWebSocketSessionRegistry sessionRegistry;

  ConversationService conversationService;

  @BeforeEach
  void setUp() {
    conversationService = new ConversationService(
        conversationRepository,
        messageRepository,
        productClients,
        sessionRegistry,
        new ObjectMapper());
  }

  @Test
  void getOrCreate_returnsExistingConversation() {
    ConversationDocument existing = ConversationDocument.builder()
        .id("conv-1")
        .buyerProfileId("buyer-1")
        .sellerProfileId("seller-1")
        .facilityId("facility-1")
        .facilityName("Green Loop Store")
        .lastMessageAt(Instant.parse("2026-06-01T10:00:00Z"))
        .unreadByBuyer(2)
        .build();
    when(conversationRepository.findByBuyerProfileIdAndFacilityId("buyer-1", "facility-1"))
        .thenReturn(Optional.of(existing));

    var response = conversationService.getOrCreate(
        "buyer-1", request("facility-1"));

    assertThat(response.getId()).isEqualTo("conv-1");
    assertThat(response.getUnreadCount()).isEqualTo(2);
  }

  @Test
  void getOrCreate_createsConversationFromFacility() {
    when(conversationRepository.findByBuyerProfileIdAndFacilityId("buyer-1", "facility-1"))
        .thenReturn(Optional.empty());
    when(productClients.getFacility("buyer-1", "facility-1")).thenReturn(facility("facility-1", "seller-1"));
    when(conversationRepository.save(any(ConversationDocument.class))).thenAnswer(invocation -> {
      ConversationDocument doc = invocation.getArgument(0);
      doc.setId("conv-new");
      return doc;
    });

    var response = conversationService.getOrCreate(
        "buyer-1", request("facility-1"));

    assertThat(response.getId()).isEqualTo("conv-new");
    assertThat(response.getSellerProfileId()).isEqualTo("seller-1");
    assertThat(response.getFacilityId()).isEqualTo("facility-1");
  }

  @Test
  void getOrCreate_rejectsSelfChat() {
    when(conversationRepository.findByBuyerProfileIdAndFacilityId("seller-1", "facility-1"))
        .thenReturn(Optional.empty());
    when(productClients.getFacility("seller-1", "facility-1")).thenReturn(facility("facility-1", "seller-1"));

    assertThatThrownBy(() -> conversationService.getOrCreate("seller-1", request("facility-1")))
        .isInstanceOf(AppException.class)
        .extracting(ex -> ((AppException) ex).getErrorCode())
        .isEqualTo(ErrorCode.CANNOT_MESSAGE_OWN_FACILITY);
  }

  @Test
  void sendMessage_withProductCard_updatesPreview() {
    ConversationDocument conversation = ConversationDocument.builder()
        .id("conv-1")
        .buyerProfileId("buyer-1")
        .sellerProfileId("seller-1")
        .facilityId("facility-1")
        .unreadBySeller(0)
        .build();
    when(conversationRepository.findById("conv-1")).thenReturn(Optional.of(conversation));
    when(messageRepository.save(any(MessageDocument.class))).thenAnswer(invocation -> {
      MessageDocument message = invocation.getArgument(0);
      message.setId("msg-1");
      message.setCreatedAt(Instant.parse("2026-06-01T10:30:00Z"));
      return message;
    });
    when(conversationRepository.save(any(ConversationDocument.class))).thenAnswer(invocation -> invocation.getArgument(0));

    SendMessageRequest request = new SendMessageRequest();
    request.setProductCard(com.naodab.mailservice.models.MessageProductCard.builder()
        .listingId("listing-1")
        .title("Máy ảnh")
        .build());

    var response = conversationService.sendMessage("buyer-1", "conv-1", request);

    assertThat(response.getProductCard().getTitle()).isEqualTo("Máy ảnh");
    ArgumentCaptor<ConversationDocument> captor = ArgumentCaptor.forClass(ConversationDocument.class);
    verify(conversationRepository).save(captor.capture());
    assertThat(captor.getValue().getLastMessagePreview()).isEqualTo("[Sản phẩm] Máy ảnh");
  }

  @Test
  void sendMessage_updatesConversationAndUnreadForRecipient() {
    ConversationDocument conversation = ConversationDocument.builder()
        .id("conv-1")
        .buyerProfileId("buyer-1")
        .sellerProfileId("seller-1")
        .facilityId("facility-1")
        .unreadBySeller(0)
        .build();
    when(conversationRepository.findById("conv-1")).thenReturn(Optional.of(conversation));
    when(messageRepository.save(any(MessageDocument.class))).thenAnswer(invocation -> {
      MessageDocument message = invocation.getArgument(0);
      message.setId("msg-1");
      message.setCreatedAt(Instant.parse("2026-06-01T10:30:00Z"));
      return message;
    });
    when(conversationRepository.save(any(ConversationDocument.class))).thenAnswer(invocation -> invocation.getArgument(0));

    SendMessageRequest request = new SendMessageRequest();
    request.setContent("Xin chào shop");

    var response = conversationService.sendMessage("buyer-1", "conv-1", request);

    assertThat(response.getContent()).isEqualTo("Xin chào shop");
    ArgumentCaptor<ConversationDocument> captor = ArgumentCaptor.forClass(ConversationDocument.class);
    verify(conversationRepository).save(captor.capture());
    assertThat(captor.getValue().getUnreadBySeller()).isEqualTo(1);
    assertThat(captor.getValue().getLastMessagePreview()).isEqualTo("Xin chào shop");
  }

  @Test
  void markRead_clearsUnreadForBuyer() {
    ConversationDocument conversation = ConversationDocument.builder()
        .id("conv-1")
        .buyerProfileId("buyer-1")
        .sellerProfileId("seller-1")
        .unreadByBuyer(3)
        .build();
    when(conversationRepository.findById("conv-1")).thenReturn(Optional.of(conversation));
    when(conversationRepository.save(any(ConversationDocument.class))).thenAnswer(invocation -> invocation.getArgument(0));

    var response = conversationService.markRead("buyer-1", "conv-1");

    assertThat(response.getUnreadCount()).isZero();
  }

  @Test
  void listMessages_returnsChronologicalOrder() {
    ConversationDocument conversation = ConversationDocument.builder()
        .id("conv-1")
        .buyerProfileId("buyer-1")
        .sellerProfileId("seller-1")
        .build();
    when(conversationRepository.findById("conv-1")).thenReturn(Optional.of(conversation));
    when(messageRepository.findByConversationIdOrderByCreatedAtDesc(eq("conv-1"), any(Pageable.class)))
        .thenReturn(List.of(
            message("msg-2", "conv-1", "seller-1", "Reply", Instant.parse("2026-06-01T10:05:00Z")),
            message("msg-1", "conv-1", "buyer-1", "Hello", Instant.parse("2026-06-01T10:00:00Z"))));

    var messages = conversationService.listMessages("buyer-1", "conv-1", 50);

    assertThat(messages).extracting("id").containsExactly("msg-1", "msg-2");
  }

  private static CreateConversationRequest request(String facilityId) {
    CreateConversationRequest request = new CreateConversationRequest();
    request.setFacilityId(facilityId);
    return request;
  }

  private static FacilitySummary facility(String facilityId, String ownerId) {
    FacilitySummary facility = new FacilitySummary();
    facility.setId(facilityId);
    facility.setName("Green Loop Store");
    facility.setOwnerId(ownerId);
    return facility;
  }

  private static MessageDocument message(
      String id, String conversationId, String senderProfileId, String content, Instant createdAt) {
    return MessageDocument.builder()
        .id(id)
        .conversationId(conversationId)
        .senderProfileId(senderProfileId)
        .content(content)
        .createdAt(createdAt)
        .build();
  }
}
