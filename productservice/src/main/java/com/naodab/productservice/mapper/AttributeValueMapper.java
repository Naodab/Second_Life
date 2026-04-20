package com.naodab.productservice.mapper;

import org.springframework.stereotype.Component;

import com.naodab.productservice.dto.response.AttributeValueResponse;
import com.naodab.productservice.models.AttributeValue;

@Component
public class AttributeValueMapper {
  public AttributeValueResponse toAttributeValueResponse(AttributeValue attributeValue) {
    return AttributeValueResponse.builder()
        .id(attributeValue.getId())
        .value(attributeValue.getValue())
        .build();
  }

}
