-- Join table for Attribute.subCategoryIds (@ElementCollection).
-- Required after commit 34eac94 (phone-scoped attributes).

CREATE TABLE IF NOT EXISTS attribute_sub_categories (
    attribute_id VARCHAR(255) NOT NULL,
    sub_category_id VARCHAR(255) NOT NULL,
    PRIMARY KEY (attribute_id, sub_category_id),
    CONSTRAINT fk_attribute_sub_categories_attribute
        FOREIGN KEY (attribute_id) REFERENCES attributes (id)
);

-- Phone-only attributes (empty list = visible for all sub-categories).
INSERT IGNORE INTO attribute_sub_categories (attribute_id, sub_category_id) VALUES
    ('attr-ram', 'sub-phone'),
    ('attr-sim-lock', 'sub-phone'),
    ('attr-screen-size', 'sub-phone'),
    ('attr-battery-health', 'sub-phone');
