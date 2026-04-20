package com.naodab.productservice.services.impl;

import com.naodab.productservice.services.AttributeService;

import jakarta.transaction.Transactional;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.productservice.dto.request.AttributeCreateRequest;
import com.naodab.productservice.dto.response.AttributeResponse;
import com.naodab.productservice.repositories.AttributeRepository;
import com.naodab.productservice.mapper.AttributeMapper;
import com.naodab.productservice.models.Attribute;
import com.naodab.productservice.models.AttributeValue;
import com.naodab.productservice.repositories.AttributeValueRepository;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AttributeServiceImpl implements AttributeService {
  AttributeRepository attributeRepository;
  AttributeValueRepository attributeValueRepository;
  AttributeMapper attributeMapper;

  @Override
  @Transactional
  public AttributeResponse createAttribute(AttributeCreateRequest request) {
    if (request == null || request.getValues().isEmpty()) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }

    Attribute attribute = attributeMapper.toAttribute(request);
    if (attributeRepository.existsByName(attribute.getName())) {
      throw new AppException(ErrorCode.ATTRIBUTE_ALREADY_EXISTS);
    }

    attribute = attributeRepository.save(attribute);
    attribute.addAttributeValues(createAttributeValues(attribute, request.getValues()));

    return attributeMapper.toAttributeResponse(attribute);
  }

  @Override
  public AttributeResponse getAttributeById(String id) {
    if (id == null || id.isBlank()) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }

    return attributeRepository.findById(id)
        .map(attributeMapper::toAttributeResponse)
        .orElseThrow(() -> new AppException(ErrorCode.ATTRIBUTE_NOT_FOUND));
  }

  @Override
  public List<AttributeResponse> getAllAttributes() {
    return attributeRepository.findAll()
        .stream()
        .map(attributeMapper::toAttributeResponse)
        .toList();
  }

  @Override
  public AttributeResponse getAttributeByName(String name) {
    if (name == null || name.isBlank()) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }

    return attributeRepository.findByName(name)
        .map(attributeMapper::toAttributeResponse)
        .orElseThrow(() -> new AppException(ErrorCode.ATTRIBUTE_NOT_FOUND));
  }

  @Override
  @Transactional
  public AttributeResponse addAttributeValue(String attributeId, List<String> values) {
    if (values == null || values.isEmpty()) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }

    Attribute attribute = attributeRepository.findById(attributeId)
        .orElseThrow(() -> new AppException(ErrorCode.ATTRIBUTE_NOT_FOUND));

    attribute.addAttributeValues(createAttributeValues(attribute, values));

    return attributeMapper.toAttributeResponse(attribute);
  }

  private List<AttributeValue> createAttributeValues(Attribute attribute, List<String> values) {
    List<AttributeValue> attributeValues = new ArrayList<>();
    for (String value : values) {
      AttributeValue attributeValue = AttributeValue.builder()
          .attribute(attribute)
          .value(value)
          .build();
      if (attributeValueRepository.existsByAttributeIdAndValue(attribute.getId(), value)) {
        throw new AppException(ErrorCode.ATTRIBUTE_VALUE_ALREADY_EXISTS);
      }

      attributeValues.add(attributeValue);
    }

    return attributeValueRepository.saveAll(attributeValues);
  }
}
