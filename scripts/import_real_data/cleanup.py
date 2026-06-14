#!/usr/bin/env python3
"""
Deprecated — dùng purge_seed_products.py thay thế.

Script cũ chỉ xóa products/listings trên MySQL + ES local, không xóa
orders / rental_orders / cart_items / inventory.

  python3 purge_seed_products.py --dry-run
  python3 purge_seed_products.py --confirm
"""
from __future__ import annotations

import sys

print(__doc__)
sys.exit(
  __import__("subprocess").call(
    [sys.executable, "purge_seed_products.py", *sys.argv[1:]],
    cwd=__import__("pathlib").Path(__file__).parent,
  )
)
