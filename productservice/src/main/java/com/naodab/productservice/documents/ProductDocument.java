package com.naodab.productservice.documents;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.DateFormat;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import org.springframework.data.elasticsearch.annotations.GeoPointField;
import org.springframework.data.elasticsearch.annotations.InnerField;
import org.springframework.data.elasticsearch.annotations.MultiField;
import org.springframework.data.elasticsearch.core.geo.GeoPoint;

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
  @Getter
  @Setter
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  @FieldDefaults(level = lombok.AccessLevel.PRIVATE)
  public static class VariantDocument {
    @Field(type = FieldType.Keyword)
    String sku;

    @Field(type = FieldType.Long)
    Long quantity;
  }

  @Id
  @Field(type = FieldType.Keyword)
  String id;

  @MultiField(mainField = @Field(type = FieldType.Text, analyzer = "standard"), otherFields = {
      @InnerField(suffix = "keyword", type = FieldType.Keyword) })
  String name;

  @Field(type = FieldType.Text, analyzer = "standard")
  String description;

  @Field(type = FieldType.Keyword)
  String thumbnailUrl;

  @Field(type = FieldType.Keyword)
  List<String> productMedias;

  @Field(type = FieldType.Keyword)
  String facilityId;

  @Field(type = FieldType.Keyword)
  String primaryCategoryId;

  @Field(type = FieldType.Keyword)
  List<String> categoryIds;

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

  @Field(type = FieldType.Nested)
  List<VariantDocument> variants;

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

  @GeoPointField
  GeoPoint location;
}
