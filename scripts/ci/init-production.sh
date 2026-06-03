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

spring_http_healthy() {
  local port="$1"
  local path="${2:-/api/v1/}"
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 3 "http://127.0.0.1:${port}${path}" 2>/dev/null || true)"
  [[ -n "$code" && "$code" != "000" && "$code" -lt 500 ]]
}

echo "=== [1/4] Infrastructure: kafka, redis ==="
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

echo "=== [2/4] Build & start backend + UI ==="
"${COMPOSE[@]}" up -d --build \
  auth-service \
  mail-service \
  profile-service \
  location-service \
  product-service \
  inventory-service \
  booking-service \
  second-life-ui

echo "=== [3/4] Đợi backend healthy (tối đa ~10 phút) ==="
BACKEND=(
  auth-service:8081:/api/v1/
  mail-service:8083:/api/v1/
  profile-service:8082:/api/v1/
  location-service:8085:/api/v1/provinces
  product-service:8086:/api/v1/
  inventory-service:8087:/api/v1/
  booking-service:8088:/api/v1/
)

for entry in "${BACKEND[@]}"; do
  svc="${entry%%:*}"
  rest="${entry#*:}"
  port="${rest%%:*}"
  path="${rest#*:}"
  echo "  waiting ${svc}..."
  for i in $(seq 1 72); do
    if docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T "$svc" \
      sh -c "code=\$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 3 http://127.0.0.1:${port}${path}); test -n \"\$code\" && test \"\$code\" != 000 && test \"\$code\" -lt 500" 2>/dev/null; then
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

echo "=== [4/4] Traefik (HTTPS gateway) ==="
"${COMPOSE[@]}" up -d traefik

date -u +"%Y-%m-%dT%H:%M:%SZ" >"$MARKER"
echo "=== Init complete (.deploy-initialized) ==="
