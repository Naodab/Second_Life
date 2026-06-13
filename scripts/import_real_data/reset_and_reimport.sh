#!/usr/bin/env bash
# Reset seed/Tiki product data và import lại từ crawl mới.
#
# Usage:
#   cd scripts/import_real_data
#   ./reset_and_reimport.sh                  # chotot + purge + seed
#   ./reset_and_reimport.sh --source tiki    # crawl Tiki (không khuyến nghị)
#   ./reset_and_reimport.sh --purge-only     # chỉ xóa, không crawl/import
#   ./reset_and_reimport.sh --skip-purge     # crawl + import (giữ DB hiện tại)
#
# Yêu cầu: .env ở repo root (MYSQL_*, OPENSEARCH_*), docker compose đang chạy.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

SOURCE="chotot"
PURGE=1
IMPORT=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --source=*) SOURCE="${1#*=}"; shift ;;
    --source) SOURCE="${2:?missing value after --source}"; shift 2 ;;
    --purge-only) IMPORT=0; shift ;;
    --skip-purge) PURGE=0; shift ;;
    --help|-h)
      grep '^#' "$0" | head -20
      exit 0
      ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [[ "$PURGE" -eq 1 ]]; then
  echo "=== [1/3] Purge seed/Tiki data ==="
  python3 purge_seed_products.py --dry-run
  read -r -p "Proceed with DELETE? Type yes: " ans
  if [[ "$ans" != "yes" ]]; then
    echo "Aborted."
    exit 1
  fi
  python3 purge_seed_products.py --confirm --also-tiki-images \
    --export-sql purge_seed_products.generated.sql
fi

if [[ "$IMPORT" -eq 0 ]]; then
  echo "Done (--purge-only)."
  exit 0
fi

echo "=== [2/3] Crawl ($SOURCE) ==="
case "$SOURCE" in
  chotot) python3 crawl_chotot.py ;;
  tiki)   python3 crawl_tiki.py ;;
  *) echo "Unknown source: $SOURCE (use chotot|tiki)"; exit 1 ;;
esac

echo "=== [3/3] Import seed_system ==="
python3 seed_system.py

echo ""
echo "✅ Hoàn tất. Nếu search chưa cập nhật, gọi admin reindex:"
echo "   POST /api/v1/products/admin/search/reindex"
echo "   POST /api/v1/listings/admin/search/reindex"
