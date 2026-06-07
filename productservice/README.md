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

Base path: `/api/v1`. Seller/admin requests require header `X-Profile-Id`; admin routes also require `role: ADMIN`.

OpenSearch index: `listings`. Kafka topic: `inventory.item.create` (`spring.kafka.topics.create-inventory-item`).

### Listing lifecycle

A listing links a **published product** to a **seller facility** and carries per-variant pricing/stock (`ListingVariant`). New listings start as `PENDING`; only `ACTIVE` listings are visible in public search and cart.

| Status | Meaning | Who sets it |
| --- | --- | --- |
| `PENDING` | Awaiting admin review (default on create) | System on `POST /listings`; seller can resubmit from `REJECTED` via `PUT /listings/{id}` |
| `ACTIVE` | Visible to buyers | Admin `POST /listings/admin/{id}/approve`; admin `POST /listings/admin/{id}/reactivate` |
| `REJECTED` | Moderation failed | Admin `POST /listings/admin/{id}/reject` |
| `INACTIVE` | Temporarily hidden | Admin `POST /listings/admin/{id}/suspend`; seller `PUT /listings/{id}` (`ACTIVE` → `INACTIVE`) |

```mermaid
stateDiagram-v2
    [*] --> PENDING: POST /listings
    PENDING --> ACTIVE: admin approve
    PENDING --> REJECTED: admin reject
    REJECTED --> PENDING: seller update (resubmit)
    ACTIVE --> INACTIVE: admin suspend / seller deactivate
    INACTIVE --> ACTIVE: admin reactivate
```

Public visibility (search, detail, cart): `listingStatus=ACTIVE` **and** `productStatus=PUBLISHED`.

### End-to-end: seller publishes a listing

Four phases. Steps 1–3 are prerequisites; step 4 is listing creation.

| Step | API | Result |
| --- | --- | --- |
| 1 | `POST /products` (`X-Profile-Id`) | Product `DRAFT` + `ProductVariant` rows |
| 2 | `POST /products/{id}/images` | Thumbnail required before publish |
| 3 | `POST /products/{id}/publish` | Product `PUBLISHED`; reindex related listings in OpenSearch |
| 3b | `POST /facilities` (`X-Profile-Id`) | Facility owned by seller (validate pin via locationservice) |
| 4 | `POST /listings` (`X-Profile-Id`) | Listing `PENDING` + variants + OpenSearch sync + Kafka inventory bootstrap |

#### Phase 1–3 — Product draft → published

```mermaid
sequenceDiagram
  participant UI as Seller UI
  participant P as ProductService
  participant DB as MySQL
  participant OS as OpenSearch

  UI->>P: POST /products { name, variants[], subCategoryIds, … }
  Note over P,DB: Header X-Profile-Id = seller
  P->>DB: INSERT Product (DRAFT) + ProductVariants
  P->>OS: Sync product search index
  P-->>UI: ProductResponse (status=DRAFT)

  UI->>P: POST /products/{id}/images { thumbnailUrl, … }
  P->>DB: INSERT ProductMedia (thumbnail)

  UI->>P: POST /products/{id}/publish
  P->>DB: Verify owner + DRAFT + has thumbnail
  P->>DB: UPDATE Product status → PUBLISHED
  P->>OS: Reindex listings for this product
  P-->>UI: ProductResponse (status=PUBLISHED)
```

#### Phase 3b — Create facility (once per warehouse/shop)

```mermaid
sequenceDiagram
  participant UI as Seller UI
  participant P as ProductService
  participant L as LocationService
  participant DB as MySQL

  UI->>P: POST /facilities { name, provinceCode, wardCode, lat, lon, … }
  P->>L: GET /provinces/{p}/wards/{w}/valid-location?latitude=&longitude=
  alt pin outside ward
    P-->>UI: FACILITY_LOCATION_INVALID
  else valid
    P->>DB: INSERT Facility (ownerId = X-Profile-Id)
    P-->>UI: FacilityResponse
  end
```

#### Phase 4 — Create listing (core flow)

Request body (`ListingCreateRequest`):

```json
{
  "productId": "<published-product-uuid>",
  "facilityId": "<owned-facility-uuid>",
  "title": "Listing title",
  "description": "optional",
  "listingType": "BUY",
  "variants": [
    {
      "productVariantId": "<product-variant-uuid>",
      "quantity": 10,
      "buyPrice": 150000,
      "rentPrice": null,
      "rentUnit": "DAY",
      "isActive": true
    }
  ]
}
```

- `listingType`: `BUY` (default) or `RENT` — drives which price field is used for `minPrice`/`maxPrice` and inventory mode.
- Each variant must reference a `ProductVariant` belonging to `productId`; `quantity` is required (`@NotNull`, `>= 0`).
- If `variants` is empty, listing is saved but **no** Kafka inventory event is published.

```mermaid
sequenceDiagram
  participant UI as Seller UI
  participant P as ProductService
  participant DB as MySQL
  participant OS as OpenSearch
  participant K as Kafka
  participant I as InventoryService

  UI->>P: POST /listings + X-Profile-Id
  Note over P: ListingCreateRequest

  P->>DB: Load Product by productId
  alt product missing / deleted
    P-->>UI: INVALID_INPUT
  else product.ownerId ≠ X-Profile-Id
    P-->>UI: UNAUTHORIZED
  else product.status ≠ PUBLISHED
    P-->>UI: PRODUCT_NOT_PUBLISHED
  end

  P->>DB: Load Facility by facilityId + ownerId
  alt facility not owned
    P-->>UI: FACILITY_NOT_FOUND
  end

  P->>DB: INSERT Listing (status=PENDING, min/max from variant prices)
  loop each variant in request.variants
    P->>DB: Verify ProductVariant belongs to product
    P->>DB: INSERT ListingVariant (quantity, buy/rent price, isActive)
  end

  P->>DB: flush + reload listing graph (product, facility, categories)
  P->>OS: sync(ListingDocument) — indexed even while PENDING
  P->>K: inventory.item.create { listingVariantId, buyQuantity|rentQuantity, mode }
  K->>I: CreateInventoryItemConsumer
  I->>I: Create BUY or RENT InventoryItem per variant line

  P-->>UI: ListingResponse (listingStatus=PENDING)
```

**Side effects on create (same transaction, ordered):**

1. MySQL: `listings` + `listing_variants`
2. OpenSearch: upsert `ListingDocument` (admin can query `PENDING` via `/listings/admin/pending`)
3. Kafka → inventoryservice: bootstrap stock rows (`buyQuantity` for `BUY`, `rentQuantity` for `RENT`)

### Admin moderation

Only `PENDING` listings can be approved or rejected. Suspend/reactivate apply to `ACTIVE` / `INACTIVE`.

```mermaid
sequenceDiagram
  participant UI as Admin UI
  participant P as ProductService
  participant DB as MySQL
  participant OS as OpenSearch

  UI->>P: GET /listings/admin/pending (role=ADMIN)
  P->>OS: Search listingStatus=PENDING
  OS-->>P: Pending ListingDocument page
  P-->>UI: PagedItemsResponse

  alt approve
    UI->>P: POST /listings/admin/{id}/approve
    P->>DB: listingStatus PENDING → ACTIVE
  else reject
    UI->>P: POST /listings/admin/{id}/reject
    P->>DB: listingStatus PENDING → REJECTED
  else suspend active listing
    UI->>P: POST /listings/admin/{id}/suspend
    P->>DB: listingStatus ACTIVE → INACTIVE
  else reactivate
    UI->>P: POST /listings/admin/{id}/reactivate
    P->>DB: listingStatus INACTIVE → ACTIVE
  end

  P->>OS: sync(ListingDocument)
  P-->>UI: ListingResponse
```

Seller resubmit after rejection: `PUT /listings/{id}` with `listingStatus: PENDING` (only allowed from `REJECTED`).

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

### Add to cart (buyer, after listing is ACTIVE)

```mermaid
sequenceDiagram
  participant UI as Buyer UI
  participant P as ProductService
  participant DB as MySQL

  UI->>P: POST /cart { listingId, listingVariantId, mode, quantity, rental dates? }
  Note over P: Header X-Profile-Id = buyer
  P->>DB: Verify listing ACTIVE, variant active, product PUBLISHED
  P->>DB: INSERT CartItem
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
