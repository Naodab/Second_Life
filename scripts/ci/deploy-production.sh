#!/usr/bin/env bash
# Selective production redeploy (service names as arguments).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)
MARKER="${ROOT}/.deploy-initialized"

if [[ ! -f .env ]]; then
  echo "Missing .env — run production init first." >&2
  exit 1
fi

if [[ ! -f "$MARKER" ]]; then
  echo "VPS not initialized — run production init first." >&2
  exit 1
fi

if [[ $# -lt 1 || -z "${1// }" ]]; then
  echo "Không có service nào để deploy."
  exit 0
fi

RAW="$*"
RAW="${RAW//,/ }"
read -ra SERVICES <<<"$RAW"

needs_backend=false
for svc in "${SERVICES[@]}"; do
  case "$svc" in
    auth-service|mail-service|profile-service|location-service|product-service|inventory-service|booking-service|traefik|second-life-ui)
      needs_backend=true
      ;;
  esac
done

if [[ "$needs_backend" == true ]]; then
  echo "=== Đảm bảo kafka + redis đang chạy ==="
  "${COMPOSE[@]}" up -d kafka redis
fi

deploy_one() {
  local svc="$1"
  echo "=== Deploy: ${svc} ==="

  case "$svc" in
    traefik)
      "${COMPOSE[@]}" up -d traefik
      ;;
    second-life-ui)
      "${COMPOSE[@]}" build "$svc"
      "${COMPOSE[@]}" up -d --no-deps "$svc"
      ;;
    auth-service|mail-service|profile-service|location-service|product-service|inventory-service|booking-service)
      "${COMPOSE[@]}" build "$svc"
      "${COMPOSE[@]}" up -d --no-deps "$svc"
      ;;
    *)
      echo "Service không hỗ trợ: ${svc}" >&2
      exit 1
      ;;
  esac
}

for svc in "${SERVICES[@]}"; do
  deploy_one "$svc"
done

HAS_API=false
HAS_TRAEFIK=false
for svc in "${SERVICES[@]}"; do
  case "$svc" in
    traefik) HAS_TRAEFIK=true ;;
    auth-service|mail-service|profile-service|location-service|product-service|inventory-service|booking-service)
      HAS_API=true
      ;;
  esac
done
if [[ "$HAS_API" == true && "$HAS_TRAEFIK" == false ]]; then
  echo "=== Reload Traefik routes ==="
  "${COMPOSE[@]}" up -d traefik
fi

echo "=== Deploy hoàn tất: ${SERVICES[*]} ==="
