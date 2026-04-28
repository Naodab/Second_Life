package com.naodab.productservice.documents;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.DateFormat;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import com.naodab.productservice.models.Product.ProductStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Document(indexName = "products")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class ProductDocument {
  @Id
  String id;

  @Field(type = FieldType.Text, analyzer = "standard")
  String name;

  @Field(type = FieldType.Text, analyzer = "standard")
  String description;

  @Field(type = FieldType.Keyword)
  String facilityId;

  @Field(type = FieldType.Keyword)
  List<String> subCategoryIds;

  @Field(type = FieldType.Keyword)
  String primarySubCategoryId;

  @Field(type = FieldType.Keyword)
  List<String> attributeIds;

  @Field(type = FieldType.Text, analyzer = "standard")
  List<String> attributeValues;

  @Field(type = FieldType.Keyword)
  List<String> variantSkus;

  @Field(type = FieldType.Keyword)
  ProductStatus status;

  @Field(type = FieldType.Date, format = DateFormat.date_hour_minute_second_millis)
  LocalDateTime createdAt;

  @Field(type = FieldType.Date, format = DateFormat.date_hour_minute_second_millis)
  LocalDateTime updatedAt;

  @Field(type = FieldType.Keyword)
  String provinceCode;

  @Field(type = FieldType.Keyword)
  String wardCode;

  @Field(type = FieldType.Float)
  Float latitude;

  @Field(type = FieldType.Float)
  Float longitude;
}
