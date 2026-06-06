package com.naodab.mailservice.dto;

import java.util.List;

import com.naodab.mailservice.models.MessageOrderCard;
import com.naodab.mailservice.models.MessageProductCard;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MessagePayload {
  @Size(max = 4000)
  String content;

  @Size(max = 10)
  List<@Size(max = 2048) String> imageUrls;

  @Valid
  MessageProductCard productCard;

  @Valid
  MessageOrderCard orderCard;
}
