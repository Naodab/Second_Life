-- Bảng khớp InventoryItem + BaseEntity ( Hibernate validate / MySQL 8+ )
CREATE TABLE inventory_items (
    id VARCHAR(36) NOT NULL,
    listing_variant_id VARCHAR(255) NULL,
    buy_quantiy BIGINT NULL,
    rent_quantity BIGINT NULL,
    mode VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NULL,
    deleted_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    KEY idx_listing_variant_id (listing_variant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng khớp InventoryReservation + BaseEntity
CREATE TABLE inventory_reservations (
    id VARCHAR(36) NOT NULL,
    listing_variant_id VARCHAR(255) NULL,
    mode VARCHAR(255) NULL,
    quantity BIGINT NULL,
    status VARCHAR(255) NULL,
    reference_id VARCHAR(255) NULL,
    expires_at DATETIME(6) NULL,
    rental_start DATE NULL,
    rental_end DATE NULL,
    rental_slot_start DATETIME(6) NULL,
    rental_slot_end DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NULL,
    deleted_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    KEY idx_res_listing_mode_status (listing_variant_id, mode, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
