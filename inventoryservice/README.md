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

## Check availability

Stock-check endpoints used by **bookingservice** (pre-checkout) and **UI** (product detail / checkout). They only **read** inventory — no reservation is created or changed.

| Endpoint | Mode | Purpose |
| --- | --- | --- |
| `GET /listing-variants/{id}/availability` | `BUY` (default) or `RENT` | Point-in-time stock |
| `GET /listing-variants/{id}/availability-in-range` | `RENT` (default) | Min free quantity in a rental window `[from, to)` |

**BUY** `/availability` supports two call styles:

| Call style | Query | Behaviour |
| --- | --- | --- |
| **Return stock count** | no `quantity` | Always **200** with `availableQuantity`; caller decides if that is enough |
| **Validate requested amount** | `quantity=N` | **200** if N units are available; **409** if not enough; **404** if item not tracked |

**bookingservice** uses **return stock count** (no `quantity`). **RENT** `/availability-in-range` always uses return-stock-count style (always **200**).

**Active reservation** (subtracted for BUY, blocks intervals for RENT): `status ∈ {PENDING, CONFIRMED}`, `deleted_at IS NULL`, and `expires_at IS NULL OR expires_at > now`.

| Mode | Formula |
| --- | --- |
| **BUY** (`/availability`) | `available = max(0, buy_quantity − Σ active reserved qty)` |
| **RENT** (`/availability`) | `available = rent_quantity` (physical only; no slot overlap on this endpoint) |
| **RENT** (`/availability-in-range`) | `available = min over sub-intervals of (rent_quantity − overlapping reserved qty)`; each reservation blocks its rental period **plus turnover** (+1 h for hourly slots, +1 day for daily rentals) |

Response shape: `{ tracked: boolean, availableQuantity: number | null }`. If no `InventoryItem` exists for the variant + mode → `tracked = false`, `availableQuantity = null` (HTTP **200**, not 404). `/availability-in-range` also echoes `intervalStart` / `intervalEnd`.

### Sequence diagrams

| # | Diagram name | Endpoint |
| --- | --- | --- |
| 1 | [Check availability — BUY: return stock count](#1-check-availability--buy-return-stock-count) | `GET /availability?mode=BUY` |
| 2 | [Check availability — BUY: validate requested amount](#2-check-availability--buy-validate-requested-amount) | `GET /availability?mode=BUY&quantity=N` |
| 3 | [Check availability — RENT: slot capacity in range](#3-check-availability--rent-slot-capacity-in-range) | `GET /availability-in-range?mode=RENT&from=&to=` |

#### 1. Check availability — BUY: return stock count

Used by **bookingservice** checkout and UI stock display. Request has **no** `quantity` param.

```mermaid
sequenceDiagram
  title Check availability - BUY return stock count
  autonumber
  participant Caller as Caller (BookingService or UI)
  participant Ctrl as ListingVariantInventoryController
  participant Svc as InventoryAvailabilityService
  participant ItemRepo as InventoryItemRepository
  participant ResRepo as InventoryReservationRepository
  participant DB as MySQL

  Caller->>Ctrl: GET availability mode BUY (no quantity)
  Ctrl->>Svc: findAvailableQuantityIfTracked
  Svc->>ItemRepo: findByListingVariantIdAndMode
  ItemRepo->>DB: SELECT buy_quantity
  alt no InventoryItem
    Svc-->>Ctrl: Optional empty
    Ctrl-->>Caller: HTTP 200 tracked false
  else item found
    ItemRepo-->>Svc: physical buy_quantity
    Svc->>ResRepo: sumActiveReservedQuantity
    ResRepo->>DB: SUM active PENDING or CONFIRMED qty
    ResRepo-->>Svc: reserved count
    Svc->>Svc: available equals physical minus reserved
    Svc-->>Ctrl: Optional available
    Ctrl-->>Caller: HTTP 200 tracked true plus availableQuantity
    Note over Caller: Caller checks if available is enough, then POST buy reservation
  end
```

#### 2. Check availability — BUY: validate requested amount

Used by **UI** when validating a specific quantity on a form. Request includes `quantity=N`.

```mermaid
sequenceDiagram
  title Check availability - BUY validate requested amount
  autonumber
  participant Caller as Caller (UI)
  participant Ctrl as ListingVariantInventoryController
  participant Svc as InventoryAvailabilityService
  participant ItemRepo as InventoryItemRepository
  participant DB as MySQL

  Caller->>Ctrl: GET availability mode BUY with quantity N
  Ctrl->>Svc: requireAvailableQuantity
  Svc->>ItemRepo: existsByListingVariantIdAndMode
  ItemRepo->>DB: SELECT inventory_item
  alt no InventoryItem
    Svc-->>Ctrl: INVENTORY_ITEM_NOT_FOUND
    Ctrl-->>Caller: HTTP 404
  else item exists
    Svc->>Svc: getAvailableQuantity
    alt not enough stock for N
      Svc-->>Ctrl: INSUFFICIENT_INVENTORY
      Ctrl-->>Caller: HTTP 409
    else enough stock for N
      Svc-->>Ctrl: available count
      Ctrl-->>Caller: HTTP 200 tracked true plus availableQuantity
    end
  end
```

#### 3. Check availability — RENT: slot capacity in range

Used by **bookingservice** checkout and UI rental calendar. Always returns stock count for the window (always **200**).

```mermaid
sequenceDiagram
  title Check availability - RENT slot capacity in range
  autonumber
  participant Caller as Caller (BookingService or UI)
  participant Ctrl as ListingVariantInventoryController
  participant Svc as InventoryAvailabilityService
  participant ItemRepo as InventoryItemRepository
  participant ResRepo as InventoryReservationRepository
  participant DB as MySQL

  Caller->>Ctrl: GET availability-in-range (mode RENT, from, to)
  Ctrl->>Ctrl: Parse from and to as Instant
  Ctrl->>Ctrl: Validate end after start
  alt invalid interval
    Ctrl-->>Caller: HTTP 400 INVALID_INPUT
  else valid open interval q0 to q1
    Ctrl->>Svc: findMinAvailableQuantityInOpenInterval
    Note over Ctrl,Svc: Return slot capacity only, always HTTP 200

    Svc->>ItemRepo: findByListingVariantIdAndMode RENT
    ItemRepo->>DB: SELECT rent_quantity
    alt no InventoryItem
      Svc-->>Ctrl: Optional empty
      Ctrl-->>Caller: HTTP 200 tracked false
    else item found
      DB-->>ItemRepo: rent_quantity
      ItemRepo-->>Svc: physical stock

      Svc->>ResRepo: findRentalPeriodsByListingVariant
      ResRepo->>DB: SELECT active rental reservations
      DB-->>ResRepo: reservation rows
      ResRepo-->>Svc: rows

      loop each active reservation
        Svc->>Svc: Compute blocked interval plus turnover
        alt overlaps query window
          Svc->>Svc: Clip interval and attach quantity
        else no overlap
          Svc->>Svc: Skip reservation
        end
      end

      Svc->>Svc: Sweep timeline for min free quantity
      Svc->>Svc: available equals max of zero and minFree
      Svc-->>Ctrl: Optional available
      Ctrl-->>Caller: HTTP 200 tracked true plus interval bounds
      Note over Caller: Caller checks if available is enough, then POST rent reservation
    end
  end
```

## Main flows

Called synchronously by **bookingservice** during checkout (triggered by **USER** from `/checkout`). Kafka topic `inventory.reservation.create` runs the same logic asynchronously.

### End-to-end: USER buys (BUY)

```mermaid
flowchart LR
  User((USER))
  UI["Checkout UI"]
  B[bookingservice]
  I[inventoryservice]

  User --> UI
  UI -->|"POST /orders"| B
  B -->|"GET /availability?mode=BUY"| I
  B -->|"POST /reservations/buy"| I
  I --> B --> UI --> User
```

See [Check availability — BUY: return stock count](#1-check-availability--buy-return-stock-count) for the stock probe. Summary after a successful check:

```mermaid
sequenceDiagram
  actor User as USER (buyer)
  participant UI as Checkout UI
  participant B as BookingService
  participant I as InventoryService
  participant DB as MySQL

  User->>UI: Confirm buy order
  UI->>B: POST /orders
  B->>I: GET /listing-variants/{id}/availability?mode=BUY
  I->>DB: buy_quantity − active reservations
  I-->>B: availableQuantity
  B->>I: POST /reservations/buy { reservationId, listingVariantId, quantity }
  alt sufficient stock
    I->>DB: INSERT InventoryReservation (PENDING)
    I-->>B: OK
    B-->>UI: Order created
    UI-->>User: Success
  else insufficient
    I-->>B: INSUFFICIENT_INVENTORY
    B-->>UI: Error
    UI-->>User: Out of stock
  end
  opt order cancelled / DB rollback
    B->>I: DELETE /reservations/{reservationId}
    I->>DB: status → RELEASED
  end
```

### End-to-end: USER rents (RENT)

```mermaid
flowchart LR
  User((USER))
  UI["Checkout UI"]
  B[bookingservice]
  I[inventoryservice]

  User -->|"pick rental window"| UI
  UI -->|"POST /rental-orders"| B
  B -->|"GET /availability-in-range"| I
  B -->|"POST /reservations/rent"| I
  I --> B --> UI --> User
```

See [Check availability — RENT: slot capacity in range](#3-check-availability--rent-slot-capacity-in-range) for the slot probe. Summary after a successful check:

```mermaid
sequenceDiagram
  actor User as USER (buyer)
  participant UI as Checkout UI
  participant B as BookingService
  participant I as InventoryService
  participant DB as MySQL

  User->>UI: Confirm rent order + dates
  UI->>B: POST /rental-orders
  B->>I: GET /availability-in-range?mode=RENT&from=&to=
  I->>DB: min free slots in window (overlap + turnover)
  I-->>B: availableQuantity
  B->>I: POST /reservations/rent { rentalSlotStart, rentalSlotEnd, quantity }
  alt slot available
    I->>DB: INSERT InventoryReservation (PENDING, slot fields)
    I-->>B: OK
    B-->>UI: Rental order created
    UI-->>User: Success
  else insufficient
    I-->>B: INSUFFICIENT_INVENTORY
    B-->>UI: Error
    UI-->>User: Slot unavailable
  end
```

### BUY — create and release reservation (service-to-service)

```mermaid
sequenceDiagram
  participant B as BookingService
  participant I as InventoryService
  participant DB as MySQL

  Note over B,I: GET /availability?mode=BUY — see Check availability section
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

### RENT — slot availability and reservation (service-to-service)

See [Check availability — RENT: slot capacity in range](#3-check-availability--rent-slot-capacity-in-range) for the slot probe. Summary after a successful check:

```mermaid
sequenceDiagram
  participant B as BookingService
  participant I as InventoryService
  participant DB as MySQL

  Note over B,I: GET /availability-in-range?mode=RENT&from=&to= — see Check availability section
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
