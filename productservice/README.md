# productservice

Product catalog (`Product`, variants, attributes), facilities/warehouses (`Facility`), listings (`Listing`) per facility, and per-listing variant pricing. `Product` is owned by `owner_id` rather than being tied directly to a `Facility`. Integrates **OpenSearch** (Aiven) for search; primary persistence on MySQL.

## Stack

| Component | Version / notes |
| --- | --- |
| Java | 21 |
| Spring Boot | Web, Validation, Data JPA |
| MySQL | |
| OpenSearch | Spring Data OpenSearch (`spring-data-opensearch-starter`) + `opensearch-java` |
| Jackson YAML | |
| OpenAPI | springdoc |
| Lombok | |
| Internal deps | `commonjpa`, `commonservice` |

## Data model (JPA)

`Category` and `SubCategory` extend `CatalogItemBase` (mapped superclass: `name`, `code`, … + audit from `BaseEntity`).

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
    CartItem {
        uuid id PK
        string profile_id
        string listing_id
        string listing_variant_id
        int quantity
        enum mode
        datetime rental_start
        datetime rental_end
        enum rent_unit
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

**Note:** Location codes (`province_code`, `ward_code`) on `Facility` are lookup keys for `locationservice`, not JPA foreign keys.

## Main flows

Base path: `/api/v1`. OpenSearch index: `listings`. Kafka topic: `inventory.item.create`.

### Seller creates listing (PENDING → index → inventory bootstrap)

Prerequisite: product is `PUBLISHED` (`POST /products/{id}/publish`).

```mermaid
sequenceDiagram
  participant UI as Seller UI
  participant P as ProductService
  participant DB as MySQL
  participant OS as OpenSearch
  participant K as Kafka
  participant I as InventoryService

  UI->>P: POST /listings { productId, facilityId, variants[] }
  P->>DB: Verify product PUBLISHED + owned
  P->>DB: Verify facility owned by seller
  P->>DB: INSERT Listing (PENDING) + ListingVariants
  P->>OS: Index ListingDocument
  P->>K: inventory.item.create { listingVariants[] }
  K->>I: CreateInventoryItemConsumer
  I->>I: Create BUY/RENT InventoryItem rows
  P-->>UI: ListingResponse
```

### Admin approves listing (PENDING → ACTIVE)

Only `ACTIVE` listings appear in public search (default filters).

```mermaid
sequenceDiagram
  participant UI as Admin UI
  participant P as ProductService
  participant DB as MySQL
  participant OS as OpenSearch

  UI->>P: GET /listings/admin/pending
  P->>OS: Search listingStatus=PENDING
  OS-->>P: Pending listings
  UI->>P: POST /listings/admin/{id}/approve
  P->>DB: Load listing, set status ACTIVE
  P->>OS: Re-sync ListingDocument
  P-->>UI: ListingResponse
```

### Public listing search

```mermaid
sequenceDiagram
  participant UI as Search UI
  participant P as ProductService
  participant OS as OpenSearch
  participant DB as MySQL

  UI->>P: GET /listings/search?keyword=&filters…
  P->>P: Default filters: listingStatus=ACTIVE, productStatus=PUBLISHED
  P->>OS: Native query (keyword, geo, price, category, sort)
  OS-->>P: ListingDocument hits + total
  opt profile header present
    P->>DB: Async save SearchHistories
  end
  P-->>UI: PagedItemsResponse
```

### Facility creation + add to cart

```mermaid
sequenceDiagram
  participant UI as Frontend
  participant P as ProductService
  participant L as LocationService
  participant DB as MySQL

  Note over UI,DB: Create facility
  UI->>P: POST /facilities { name, provinceCode, wardCode, lat, lon, … }
  P->>L: GET /provinces/{p}/wards/{w}/valid-location?latitude=&longitude=
  L-->>P: pin inside ward boundary?
  alt invalid location
    P-->>UI: FACILITY_LOCATION_INVALID
  else valid
    P->>DB: INSERT Facility (ownerId from header)
    P-->>UI: FacilityResponse
  end

  Note over UI,DB: Add to cart
  UI->>P: POST /cart { listingId, listingVariantId, mode, quantity, rental dates? }
  P->>DB: Verify listing ACTIVE, variant active, product PUBLISHED
  P->>DB: INSERT CartItem (profileId)
  P-->>UI: CartItemResponse
```

## Common environment variables

| Variable | Description |
|------|--------|
| `SERVER_PORT_PRODUCT_SERVICE` | HTTP port |
| `MYSQL_URL` / `MYSQL_USERNAME` / `MYSQL_PASSWORD` | Catalog database |
| `OPENSEARCH_*` / `AIVEN_*` | Search cluster connection |
| `KAFKA_BOOTSTRAP_SERVERS` | Kafka broker |
| `LOCATION_SERVICE_URL` | Ward/province validation |
