package com.naodab.productservice.mapper;

import org.springframework.stereotype.Component;

import com.naodab.productservice.dto.request.AttributeCreateRequest;
import com.naodab.productservice.dto.response.AttributeResponse;
import com.naodab.productservice.models.Attribute;

import lombok.experimental.FieldDefaults;
import lombok.RequiredArgsConstructor;

@Component
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class AttributeMapper {
  AttributeValueMapper attributeValueMapper;

  public AttributeResponse toAttributeResponse(Attribute attribute) {
    return AttributeResponse.builder()
        .id(attribute.getId())
        .name(attribute.getName())
        .attributeValues(
            attribute.getAttributeValues().stream().map(attributeValueMapper::toAttributeValueResponse).toList())
        .build();
  }

  public Attribute toAttribute(AttributeCreateRequest request) {
    if (request == null) {
      return null;
    }

    return Attribute.builder()
        .name(request.getName())
        .build();
  }
}
