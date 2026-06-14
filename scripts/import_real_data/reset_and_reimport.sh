#!/usr/bin/env bash
# Reset seed/Tiki product data và import lại từ crawl mới.
#
# Usage:
#   cd scripts/import_real_data
#   ./reset_and_reimport.sh                  # tiki + purge + fix + seed (mặc định)
#   ./reset_and_reimport.sh --source chotot
#   ./reset_and_reimport.sh --purge-only
#   ./reset_and_reimport.sh --skip-purge
#   ./reset_and_reimport.sh --yes            # không hỏi xác nhận
#
# Yêu cầu: .env ở repo root (MYSQL_*, OPENSEARCH_*), docker compose đang chạy.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

exec python3 reset_clean_import.py "$@"
