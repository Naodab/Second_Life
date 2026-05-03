package com.naodab.productservice.documents;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.DateFormat;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import org.springframework.data.elasticsearch.annotations.GeoPointField;
import org.springframework.data.elasticsearch.core.geo.GeoPoint;

import com.naodab.productservice.models.Listing.ListingStatus;
import com.naodab.productservice.models.Listing.ListingType;
import com.naodab.productservice.models.Product.ProductStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Document(indexName = "listings")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class ListingDocument {
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
  String id;

  @Field(type = FieldType.Text, analyzer = "standard")
  String title;

  @Field(type = FieldType.Text, analyzer = "standard")
  String listingDescription;

  @Field(type = FieldType.Double)
  Double minPrice;

  @Field(type = FieldType.Double)
  Double maxPrice;

  @Field(type = FieldType.Keyword)
  ListingType listingType;

  @Field(type = FieldType.Keyword)
  ListingStatus listingStatus;

  @Field(type = FieldType.Text, analyzer = "standard")
  String name;

  @Field(type = FieldType.Text, analyzer = "standard")
  String description;

  @Field(type = FieldType.Keyword)
  String thumbnailUrl;

  @Field(type = FieldType.Keyword)
  List<String> productMedias;

  @Field(type = FieldType.Keyword)
  String facilityId;

  @Field(type = FieldType.Text, analyzer = "standard")
  String facilityName;

  @Field(type = FieldType.Keyword)
  String facilityImageUrl;

  @Field(type = FieldType.Text, analyzer = "standard")
  String facilityAddress;

  @Field(type = FieldType.Double)
  Double averageRating;

  @Field(type = FieldType.Text, analyzer = "standard")
  String primarySubCategoryName;

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

  @Field(type = FieldType.Keyword)
  String productId;

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
