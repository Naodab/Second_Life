CREATE TABLE IF NOT EXISTS cart_items (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    profile_id VARCHAR(64) NOT NULL,
    listing_id VARCHAR(36) NOT NULL,
    listing_variant_id VARCHAR(36) NOT NULL,
    quantity INT NOT NULL,
    mode VARCHAR(16) NOT NULL,
    rental_start DATETIME NULL,
    rental_end DATETIME NULL,
    rent_unit VARCHAR(16) NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NULL,
    deleted_at DATETIME NULL,
    INDEX idx_cart_profile_id (profile_id)
);
