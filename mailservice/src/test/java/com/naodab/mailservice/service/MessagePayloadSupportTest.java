package com.naodab.mailservice.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.mailservice.dto.SendMessageRequest;
import com.naodab.mailservice.models.MessageDocument;
import com.naodab.mailservice.models.MessageOrderCard;
import com.naodab.mailservice.models.MessageProductCard;

class MessagePayloadSupportTest {

  @Test
  void buildPreview_prefersTextContent() {
    MessageDocument message = MessageDocument.builder()
        .content("Xin chào shop")
        .productCard(MessageProductCard.builder().title("Áo khoác").build())
        .build();
    assertThat(MessagePayloadSupport.buildPreview(message)).isEqualTo("Xin chào shop");
  }

  @Test
  void buildPreview_showsProductCardWhenNoText() {
    MessageDocument message = MessageDocument.builder()
        .productCard(MessageProductCard.builder().listingId("l1").title("Áo khoác").build())
        .build();
    assertThat(MessagePayloadSupport.buildPreview(message)).isEqualTo("[Sản phẩm] Áo khoác");
  }

  @Test
  void buildPreview_showsImagePlaceholder() {
    MessageDocument message = MessageDocument.builder()
        .imageUrls(List.of("https://res.cloudinary.com/demo/image/upload/sample.jpg"))
        .build();
    assertThat(MessagePayloadSupport.buildPreview(message)).isEqualTo("[Ảnh]");
  }

  @Test
  void buildDocument_rejectsEmptyPayload() {
    SendMessageRequest request = new SendMessageRequest();
    assertThatThrownBy(() -> MessagePayloadSupport.buildDocument("conv-1", "buyer-1", request))
        .isInstanceOf(AppException.class)
        .extracting(ex -> ((AppException) ex).getErrorCode())
        .isEqualTo(ErrorCode.INVALID_INPUT);
  }

  @Test
  void buildDocument_acceptsProductCardOnly() {
    SendMessageRequest request = new SendMessageRequest();
    request.setProductCard(MessageProductCard.builder()
        .listingId("listing-1")
        .title("Máy ảnh vintage")
        .listingType("RENT")
        .build());

    MessageDocument document = MessagePayloadSupport.buildDocument("conv-1", "buyer-1", request);

    assertThat(document.getProductCard().getListingId()).isEqualTo("listing-1");
    assertThat(document.getContent()).isNull();
  }

  @Test
  void buildDocument_acceptsImagesWithText() {
    SendMessageRequest request = new SendMessageRequest();
    request.setContent("Xem ảnh nhé");
    request.setImageUrls(List.of("https://res.cloudinary.com/demo/image/upload/sample.jpg"));

    MessageDocument document = MessagePayloadSupport.buildDocument("conv-1", "buyer-1", request);

    assertThat(document.getContent()).isEqualTo("Xem ảnh nhé");
    assertThat(document.getImageUrls()).hasSize(1);
  }

  @Test
  void buildDocument_acceptsOrderCard() {
    SendMessageRequest request = new SendMessageRequest();
    request.setOrderCard(MessageOrderCard.builder()
        .orderId("order-1")
        .orderType("BUY")
        .title("Ghế mây")
        .status("PENDING")
        .build());

    MessageDocument document = MessagePayloadSupport.buildDocument("conv-1", "buyer-1", request);

    assertThat(document.getOrderCard().getOrderId()).isEqualTo("order-1");
    assertThat(MessagePayloadSupport.buildPreview(document)).isEqualTo("[Đơn hàng] Ghế mây");
  }
}
