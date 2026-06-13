# Scripts – Second Life

Python scripts for crawling data, training a pricing model, and importing products into the system.

## Structure

```
scripts/
├── README.md
├── requirements.txt          # Shared dependencies
├── .venv/                    # Virtual env (created during setup)
│
├── pricing/                  # Crawl CSV for pricing model training
│   ├── crawl_pricing_data.py
│   ├── chotot_config.py
│   └── data/
│       └── pricing_dataset.csv
│
└── import_real_data/         # Crawl + import products into the DB
    ├── crawl_chotot.py       # Chợ Tốt → JSON
    ├── crawl_tiki.py         # Tiki → JSON (cleaner data)
    ├── seed_system.py        # Import JSON into the system
    ├── resume_import.py      # Resume interrupted imports
    ├── generate_rent_listings.py
    ├── fix_categories.py
    ├── cleanup.py
    └── data/
        └── raw_products.json
```

## Requirements

- Python 3.9+
- `docker compose up` (only needed for the DB import step)

## Setup

```bash
cd scripts
python3 -m venv .venv
source .venv/bin/activate    # macOS/Linux
# .venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

---

## 1. Crawl pricing data (CSV)

Used to train an AI pricing model for second-hand products.

```bash
cd pricing

# Crawl ~5000 listings from 24 Chợ Tốt categories
python3 crawl_pricing_data.py

# Crawl more + fetch brand/model from the detail API
python3 crawl_pricing_data.py --target 10000 --fetch-details

# Phones and laptops only
python3 crawl_pricing_data.py --target 3000 --categories 5010,5040

# Resume crawl (skip existing list_ids)
python3 crawl_pricing_data.py --target 10000 --resume
```

**Output:** `pricing/data/pricing_dataset.csv`

After crawl/import, clean the dataset before training:

```bash
cd pricing
python3 clean_pricing_data.py --backup
```

Writes `pricing/data/pricing_clean_report.json` and (with `--backup`) keeps `pricing_dataset_raw.csv`.

Re-apply category fixes (laptop↔tablet, car↔motorcycle) on existing CSV:

```bash
python3 clean_pricing_data.py --input data/pricing_dataset_raw.csv --output data/pricing_dataset.csv
```

Logic lives in `category_remap.py` and `field_inference.py` (brand, capacity, color, year, condition, origin, warranty from title/description + JSON params). Also used when crawling new data.

### Train on Google Colab

1. Upload `pricing/data/pricing_dataset.csv` to Google Drive: `MyDrive/SecondLife/pricing_dataset.csv`
2. Open `pricing/price_prediction_xgboost.ipynb` in [Colab](https://colab.research.google.com/) (upload the `.ipynb` or open from repo)
3. **Runtime → Run all** — artifacts save to `MyDrive/SecondLife/pricing_model/` and download `pricing_model_artifacts.zip`
4. Unzip into repo: `scripts/pricing/model/` (`xgboost_price_model.json`, `label_encoders.pkl`, `model_metadata.json`)

Key columns for ML:

| Column | Purpose |
|--------|---------|
| `price_vnd` | Target — sale price (VND) |
| `title`, `description` | Text features / NLP |
| `sl_category_id`, `sl_sub_category_id` | Second Life categories |
| `sl_condition`, `brand`, `model` | Tabular features |
| `region_name`, `num_images` | Additional features |

Chợ Tốt categories are mapped to the Second Life taxonomy in `chotot_config.py`.

> The script adds a 0.8–1.5s delay between requests to avoid being blocked by Chợ Tốt.

---

## 2. Crawl + import demo data into the DB

### Step 2a – Crawl JSON (Tiki)

```bash
cd import_real_data
python3 crawl_tiki.py
```

**Output:** `import_real_data/data/raw_products.json` — includes attribute value IDs (Condition, Color, Brand, Origin, Warranty, Region, Capacity) and `manufactureYear`.

> Ensure the DB has seeded attributes from `productservice/.../attributes-seed.yml` (first productservice startup or migration run).

### Step 2b – Import into the system

> Make sure `docker compose up` is running before importing.

```bash
cd import_real_data
python3 seed_system.py
```

Automated pipeline:

| Phase | Description |
|-------|-------------|
| 1 | Register 8 seller accounts via API |
| 2 | Bypass email verification via MySQL |
| 3 | Login and obtain JWT tokens |
| 4 | Fetch province/ward codes from the location API |
| 5 | Create facilities (2 per seller) |
| 6–9 | Create Product → Upload images → Publish → Create Listing |

**Log:** `import_real_data/seed_system.log`

### Resume interrupted import

```bash
cd import_real_data
python3 resume_import.py        # start from item 350 (default)
python3 resume_import.py 400    # start from item 400
```

### Reset bad seed data (Tiki) and re-import

Dữ liệu import từ `crawl_tiki.py` / `seed_system.py` gắn với seller `seller1@secondlife.dev` … `seller8@secondlife.dev`.
Không có cột `source` trong DB — script purge nhận diện qua `owner_id` seed sellers (+ tuỳ chọn ảnh `tikicdn`).

```bash
cd import_real_data

# 1. Xem trước sẽ xóa gì (đọc MYSQL_* / OPENSEARCH_* từ repo .env)
python3 purge_seed_products.py --dry-run

# 2. Xóa MySQL + OpenSearch (orders, cart, inventory, listings, products, facilities)
python3 purge_seed_products.py --confirm --also-tiki-images \
  --export-sql purge_seed_products.generated.sql

# 3. Crawl lại (khuyến nghị Chợ Tốt thay Tiki) + import
python3 crawl_chotot.py
python3 seed_system.py

# Hoặc một lệnh (có prompt xác nhận):
chmod +x reset_and_reimport.sh
./reset_and_reimport.sh              # chotot
./reset_and_reimport.sh --source tiki
```

SQL tham khảo thủ công: `purge_seed_products.sql`  
`cleanup.py` → alias của `purge_seed_products.py` (bản cũ không xóa orders/cart).

### Other utility scripts

```bash
cd import_real_data
python3 generate_rent_listings.py   # Create additional RENT listings
python3 fix_categories.py           # Fix category mapping
```

---

## Default seed accounts

| Email | Password |
|-------|----------|
| seller1@secondlife.dev | Seller@123456 |
| … | … |
| seller8@secondlife.dev | Seller@123456 |

## Troubleshooting

**"Cannot find raw_products.json"**
→ Run `crawl_chotot.py` or `crawl_tiki.py` in `import_real_data/` first

**"DB error: Access denied"**
→ Check MySQL credentials in `seed_system.py`

**"Login failed"**
→ Increase `KAFKA_WAIT_SECS` in `seed_system.py`

**Pricing crawl duplicates / want to append more data**
→ Use `--resume` when running `crawl_pricing_data.py`
