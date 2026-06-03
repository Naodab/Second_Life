#!/usr/bin/env python3
"""Delete products, listings, and listing_variants created by seed sellers (MySQL + Elasticsearch)."""
from __future__ import annotations
import pymysql
import pymysql.cursors
import requests

MYSQL_HOST     = ""
MYSQL_PORT     = ""
MYSQL_USER     = ""
MYSQL_PASSWORD = ""
MYSQL_DB       = "defaultdb"

SELLER_PROFILE_IDS = [
  "437b2a95-ce24-4cf4-a370-db5a586bcb7a",  # seller1
  "6304e3f7-757a-46c6-9bfa-0a4f61f2fb91",  # seller2
  "c1cdfa24-9044-46b2-aa8f-e17d392b78b9",  # seller3
  "a6e4ba11-71b4-483a-ab49-0452d60409c7",  # seller4
  "61304564-3935-47b0-80d4-77dad818e359",  # seller5
  "153ff742-f183-4e28-aa34-a8fdeee325b7",  # seller6
  "40ef54e3-4025-4ebc-a5a0-ec06df18de19",  # seller7
  "169c10ba-a3f6-4127-ab32-fa1dfd0544e3",  # seller8
]

def main():
  conn = pymysql.connect(
    host=MYSQL_HOST, port=MYSQL_PORT,
    user=MYSQL_USER, password=MYSQL_PASSWORD,
    database=MYSQL_DB,
    ssl={"ssl_disabled": False},
    cursorclass=pymysql.cursors.DictCursor,
    connect_timeout=10,
  )
  ph = ", ".join(["%s"] * len(SELLER_PROFILE_IDS))

  with conn:
    with conn.cursor() as cur:
      # 1. Get product IDs for sellers
      cur.execute(f"SELECT id FROM products WHERE owner_id IN ({ph})", SELLER_PROFILE_IDS)
      product_ids = [r["id"] for r in cur.fetchall()]
      print(f"Products to delete: {len(product_ids)}")

      if product_ids:
        p_ph = ", ".join(["%s"] * len(product_ids))

        # 2. Get listing IDs
        cur.execute(f"SELECT id FROM listings WHERE product_id IN ({p_ph})", product_ids)
        listing_ids = [r["id"] for r in cur.fetchall()]
        print(f"Listings to delete: {len(listing_ids)}")

        if listing_ids:
          l_ph = ", ".join(["%s"] * len(listing_ids))
          # 3. Delete listing_variants
          cur.execute(f"DELETE FROM listing_variants WHERE listing_id IN ({l_ph})", listing_ids)
          print(f"  Deleted listing_variants: {cur.rowcount}")
          # 4. Delete listings
          cur.execute(f"DELETE FROM listings WHERE id IN ({l_ph})", listing_ids)
          print(f"  Deleted listings: {cur.rowcount}")

        # 5. Delete product media
        cur.execute(f"DELETE FROM product_media WHERE product_id IN ({p_ph})", product_ids)
        print(f"  Deleted product_media: {cur.rowcount}")

        # 6. Get variant IDs
        cur.execute(f"SELECT id FROM product_variants WHERE product_id IN ({p_ph})", product_ids)
        variant_ids = [r["id"] for r in cur.fetchall()]
        if variant_ids:
          v_ph = ", ".join(["%s"] * len(variant_ids))
          cur.execute(f"DELETE FROM product_variant_attribute_values WHERE product_variant_id IN ({v_ph})", variant_ids)
          print(f"  Deleted variant_attribute_values: {cur.rowcount}")
          cur.execute(f"DELETE FROM product_variants WHERE id IN ({v_ph})", variant_ids)
          print(f"  Deleted product_variants: {cur.rowcount}")

        # 7. Delete product_sub_categories
        cur.execute(f"DELETE FROM product_sub_categories WHERE product_id IN ({p_ph})", product_ids)
        print(f"  Deleted product_sub_categories: {cur.rowcount}")

        # 8. Delete products
        cur.execute(f"DELETE FROM products WHERE id IN ({p_ph})", product_ids)
        print(f"  Deleted products: {cur.rowcount}")

      conn.commit()
      print("✅ MySQL cleanup done!")

    # ── Delete from Elasticsearch ──────────────────────────────────────────
    es_cleanup(product_ids, listing_ids if product_ids else [])

  print("✅ Cleanup complete!")


ES_URL = "http://localhost:9200"

def es_delete_by_ids(index: str, ids: list[str]):
  """Delete documents by ID list via Elasticsearch Bulk API."""
  if not ids:
    return 0
  body_lines = []
  for doc_id in ids:
    body_lines.append('{"delete":{"_index":"' + index + '","_id":"' + doc_id + '"}}')
  body = "\n".join(body_lines) + "\n"
  resp = requests.post(
    f"{ES_URL}/_bulk",
    data=body,
    headers={"Content-Type": "application/x-ndjson"},
    timeout=30,
  )
  if resp.status_code == 200:
    result = resp.json()
    deleted = sum(1 for item in result.get("items", []) if item.get("delete", {}).get("result") == "deleted")
    return deleted
  print(f"  ES bulk delete failed: {resp.status_code} {resp.text[:200]}")
  return 0


def es_delete_by_owner(index: str, owner_ids: list[str]):
  """Delete documents whose ownerId is in the list via Delete By Query."""
  if not owner_ids:
    return 0
  query = {
    "query": {
      "terms": {"ownerId": owner_ids}
    }
  }
  resp = requests.post(
    f"{ES_URL}/{index}/_delete_by_query",
    json=query,
    timeout=30,
  )
  if resp.status_code == 200:
    deleted = resp.json().get("deleted", 0)
    return deleted
  print(f"  ES delete_by_query failed: {resp.status_code} {resp.text[:200]}")
  return 0


def es_cleanup(product_ids: list[str], listing_ids: list[str]):
  """Delete products and listings from Elasticsearch."""
  try:
    # Delete listings by ID
    if listing_ids:
      n = es_delete_by_ids("listings", listing_ids)
      print(f"  ES deleted listings: {n}/{len(listing_ids)}")
    else:
      # Fallback: delete by ownerId (field in ListingDocument)
      n = es_delete_by_owner("listings", SELLER_PROFILE_IDS)
      print(f"  ES deleted listings by owner: {n}")

    # Delete products by ID
    if product_ids:
      n = es_delete_by_ids("products", product_ids)
      print(f"  ES deleted products: {n}/{len(product_ids)}")
    else:
      n = es_delete_by_owner("products", SELLER_PROFILE_IDS)
      print(f"  ES deleted products by owner: {n}")

  except Exception as exc:
    print(f"  ⚠ ES cleanup error (MySQL unaffected): {exc}")


if __name__ == "__main__":
  main()
