# inventoryservice

Stock and reservation service for listing variants: tracks BUY/RENT quantities per `listing_variant_id` and manages time-bounded reservations consumed by **bookingservice**.

- **Context path:** `/api/v1`
- **Default port:** configured via `SERVER_PORT_INVENTORY_SERVICE`

## Stack

| Component | Version / notes |
| --- | --- |
| Java | 21 |
| Spring Boot | Web, Validation, Data JPA |
| MySQL | |
| Spring Kafka | Reservation create/release events |
| Internal deps | `commonjpa`, `commonservice` |

## Data model (JPA)

`listing_variant_id` references product-service listing variants (cross-service, no JPA FK).

```mermaid
erDiagram
    InventoryItem {
        uuid id PK
        string listing_variant_id
        bigint buy_quantity
        bigint rent_quantity
        enum mode
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }
    InventoryReservation {
        uuid id PK
        string listing_variant_id
        enum mode
        bigint quantity
        enum status
        string reference_id
        datetime expires_at
        date rental_start
        date rental_end
        datetime rental_slot_start
        datetime rental_slot_end
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }
    InventoryItem ||--o{ InventoryReservation : reserves
```

### Reservation statuses

| Status | Meaning |
| --- | --- |
| `PENDING` | Held stock, awaiting order confirmation |
| `CONFIRMED` | Linked to a confirmed order |
| `RELEASED` | Cancelled or expired; stock returned |

## Main flows

Called synchronously by **bookingservice** during checkout. Kafka topic `inventory.reservation.create` runs the same logic asynchronously.

### BUY — create and release reservation

```mermaid
sequenceDiagram
  participant B as BookingService
  participant I as InventoryService
  participant DB as MySQL

  B->>I: GET /listing-variants/{id}/availability?mode=BUY
  I->>DB: physical qty − active PENDING/CONFIRMED reservations
  I-->>B: { tracked, availableQuantity }
  B->>I: POST /reservations/buy { reservationId, listingVariantId, quantity }
  alt sufficient stock
    I->>DB: INSERT InventoryReservation (PENDING)
  else insufficient
    I-->>B: INSUFFICIENT_INVENTORY
  end
  alt order cancelled / DB rollback
    B->>I: DELETE /reservations/{reservationId}
    I->>DB: status → RELEASED
  end
```

### RENT — slot availability and reservation

```mermaid
sequenceDiagram
  participant B as BookingService
  participant I as InventoryService
  participant DB as MySQL

  B->>I: GET /listing-variants/{id}/availability-in-range?mode=RENT&from=&to=
  I->>DB: Interval overlap → min free quantity in [start, end)
  I-->>B: { tracked, availableQuantity }
  B->>I: POST /reservations/rent { rentalSlotStart, rentalSlotEnd, quantity }
  alt slot available
    I->>DB: INSERT InventoryReservation (PENDING, slot fields)
  else insufficient
    I-->>B: INSUFFICIENT_INVENTORY
  end
```

### Inventory bootstrap from new listing

When a seller creates a listing, **productservice** publishes `inventory.item.create`.

```mermaid
sequenceDiagram
  participant P as ProductService
  participant K as Kafka
  participant I as InventoryService
  participant DB as MySQL

  P->>K: inventory.item.create { listingId, listingVariants[] }
  K->>I: CreateInventoryItemConsumer
  I->>DB: INSERT InventoryItem per variant (BUY and/or RENT mode)
```

## Local setup

```bash
cp src/main/resources/application-dev.yml.example src/main/resources/application-dev.yml
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

From repo root:

```bash
mvn spring-boot:run -pl inventoryservice -am -Dspring-boot.run.profiles=dev
```

## Common environment variables

| Variable | Description |
|------|--------|
| `SERVER_PORT_INVENTORY_SERVICE` | HTTP port |
| `MYSQL_URL` / `MYSQL_USERNAME` / `MYSQL_PASSWORD` | Database |
| `KAFKA_BOOTSTRAP_SERVERS` | Kafka broker |
