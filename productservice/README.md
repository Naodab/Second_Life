# productservice

Catalog sản phẩm (`Product`, variants, attributes), cơ sở/kho (`Facility`), tin đăng (`Listing`) gắn theo cơ sở, giá variant theo listing. `Product` thuộc chủ sở hữu (`owner_id`) thay vì gắn trực tiếp vào `Facility`. Tích hợp **OpenSearch** (Aiven) cho search; persistence chính trên MySQL.

## Công nghệ

| Thành phần | Phiên bản / ghi chú |
| --- | --- |
| Java | 21 |
| Spring Boot | Web, Validation, Data JPA |
| MySQL | |
| OpenSearch | Spring Data OpenSearch (`spring-data-opensearch-starter`) + `opensearch-java` |
| Jackson YAML | |
| OpenAPI | springdoc |
| Lombok | |
| Phụ thuộc nội bộ | `commonjpa`, `commonservice` |

## Mô hình dữ liệu (JPA)

`Category` và `SubCategory` kế thừa `CatalogItemBase` (mapped superclass: `name`, `code`, … + audit từ `BaseEntity`).

```mermaid
erDiagram
    Category {
        string id PK
        string name
        string code UK
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }
    SubCategory {
        string id PK
        string category_id FK
        string name
        string code UK
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }
    ProductSubCategory {
        string product_id FK
        string sub_category_id FK
    }
    Facility {
        uuid id PK
        string owner_id
        string name
        string province_code
        string ward_code
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }
    Product {
        uuid id PK
        string owner_id
        string primary_sub_category_id FK
        string name
        enum status
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }
    ProductMedia {
        uuid id PK
        uuid product_id FK
        string url
        enum media_type
        boolean is_thumbnail
        int sort_order
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }
    ProductVariant {
        uuid id PK
        uuid product_id FK
        string sku
        bigint quantity
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }
    Attribute {
        string id PK
        string name UK
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }
    AttributeValue {
        string id PK
        string attribute_id FK
        string code
        string value
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }
    ProductVariantAttributeValue {
        uuid id PK
        uuid product_variant_id FK
        string attribute_value_id FK
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }
    Listing {
        uuid id PK
        uuid product_id FK
        uuid facility_id FK
        string title
        enum listing_type
        enum listing_status
        double min_price
        double max_price
    }
    ListingVariant {
        uuid id PK
        uuid listing_id FK
        uuid product_variant_id FK
        double buy_price
        double rent_price
        enum rent_unit
        boolean is_active
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }
    SearchHistories {
        uuid id PK
        string profile_id UK
        longtext entries_json
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }
    Category ||--o{ SubCategory : has
    SubCategory ||--o{ ProductSubCategory : links
    Product ||--o{ ProductSubCategory : links
    SubCategory ||--o{ Product : primary
    Product ||--o{ ProductMedia : has
    Product ||--o{ ProductVariant : has
    Attribute ||--o{ AttributeValue : has
    ProductVariant ||--o{ ProductVariantAttributeValue : assigns
    AttributeValue ||--o{ ProductVariantAttributeValue : referenced_by
    Product ||--o{ Listing : published_as
    Facility ||--o{ Listing : hosts
    Listing ||--o{ ListingVariant : offers
    ProductVariant ||--o{ ListingVariant : priced_row
```

**Ghi chú:** Địa điểm (`province_code`, `ward_code`) trên `Facility` là mã tra cứu với `locationservice`, không có FK JPA.
