package com.naodab.productservice.services;

import java.util.List;

import com.naodab.productservice.dto.request.AttributeCreateRequest;
import com.naodab.productservice.dto.response.AttributeResponse;

public interface AttributeService {
  AttributeResponse createAttribute(AttributeCreateRequest request);

  AttributeResponse getAttributeById(String id);

  List<AttributeResponse> getAllAttributes();

  List<AttributeResponse> getAttributesForSubCategory(String subCategoryId);

  AttributeResponse getAttributeByName(String name);

  AttributeResponse addAttributeValue(String attributeId, List<String> values);
}
