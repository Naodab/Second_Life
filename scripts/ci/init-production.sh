#!/usr/bin/env bash
# First-time production setup on VPS.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)
MARKER="${ROOT}/.deploy-initialized"

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Thiếu lệnh: $1" >&2
    exit 1
  }
}

require_cmd docker
docker compose version >/dev/null 2>&1 || {
  echo "Cần Docker Compose plugin (docker compose)" >&2
  exit 1
}

if [[ ! -f .env ]]; then
  echo "Missing .env — copy .env.production.example and configure secrets." >&2
  exit 1
fi

chmod +x scripts/ci/*.sh 2>/dev/null || true

echo "=== [1/5] Infrastructure: kafka, redis ==="
"${COMPOSE[@]}" up -d kafka redis

echo "=== Đợi Kafka healthy ==="
for i in $(seq 1 60); do
  health="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{end}}' kafka 2>/dev/null || true)"
  if [[ "$health" == "healthy" ]]; then
    echo "Kafka ready."
    break
  fi
  if [[ "$i" -eq 60 ]]; then
    echo "Kafka chưa healthy sau 60 lần thử." >&2
    "${COMPOSE[@]}" logs --tail=50 kafka >&2 || true
    exit 1
  fi
  sleep 5
done

echo "=== [2/5] Build & start ai-service ==="
"${COMPOSE[@]}" up -d --build ai-service

echo "=== Đợi ai-service healthy ==="
for i in $(seq 1 36); do
  health="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{end}}' ai-service 2>/dev/null || true)"
  if [[ "$health" == "healthy" ]]; then
    echo "ai-service ready."
    break
  fi
  if [[ "$i" -eq 36 ]]; then
    echo "ai-service chưa healthy sau 36 lần thử." >&2
    "${COMPOSE[@]}" logs --tail=50 ai-service >&2 || true
    exit 1
  fi
  sleep 5
done

echo "=== [3/5] Build & start backend + UI ==="
"${COMPOSE[@]}" up -d --build \
  auth-service \
  mail-service \
  profile-service \
  location-service \
  product-service \
  inventory-service \
  booking-service \
  second-life-ui

echo "=== [4/5] Đợi backend healthy (tối đa ~10 phút) ==="
BACKEND=(
  auth-service:8081
  mail-service:8083
  profile-service:8082
  location-service:8085
  product-service:8086
  inventory-service:8087
  booking-service:8088
)

for entry in "${BACKEND[@]}"; do
  svc="${entry%%:*}"
  port="${entry##*:}"
  echo "  waiting ${svc}..."
  for i in $(seq 1 72); do
    if docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T "$svc" \
      curl -sf "http://127.0.0.1:${port}/api/v1/v3/api-docs" -o /dev/null 2>/dev/null; then
      echo "  ${svc} OK"
      break
    fi
    if [[ "$i" -eq 72 ]]; then
      echo "  ${svc} chưa healthy — xem logs:" >&2
      "${COMPOSE[@]}" logs --tail=30 "$svc" >&2 || true
      exit 1
    fi
    sleep 10
  done
done

echo "=== [5/5] Traefik (HTTPS gateway) ==="
"${COMPOSE[@]}" up -d traefik

date -u +"%Y-%m-%dT%H:%M:%SZ" >"$MARKER"
echo "=== Init complete (.deploy-initialized) ==="
