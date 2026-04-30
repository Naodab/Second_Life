package com.naodab.productservice.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ProductUpdateRequest extends ProductUpsertRequest {
}
