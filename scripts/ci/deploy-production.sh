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

# Marker is gitignored and only written by init-production.sh. VPS set up manually
# (or init before this check existed) may run Docker without the file.
is_production_stack_running() {
  local id
  for svc in traefik auth-service second-life-ui kafka; do
    id="$("${COMPOSE[@]}" ps -q "$svc" 2>/dev/null | head -n1 || true)"
    if [[ -n "$id" ]] && docker inspect --format='{{.State.Running}}' "$id" 2>/dev/null | grep -q true; then
      return 0
    fi
  done
  return 1
}

ensure_deploy_initialized() {
  if [[ -f "$MARKER" ]]; then
    return 0
  fi
  if is_production_stack_running; then
    date -u +"%Y-%m-%dT%H:%M:%SZ" >"$MARKER"
    echo "=== Đã tạo .deploy-initialized (stack đang chạy, init trước đó không qua CI) ===" >&2
    return 0
  fi
  echo "VPS not initialized — run production init first." >&2
  echo "  • GitHub Actions: Deploy Production → init_vps = true" >&2
  echo "  • Hoặc trên VPS: ./scripts/ci/init-production.sh" >&2
  exit 1
}

ensure_deploy_initialized

if [[ $# -lt 1 || -z "${1// }" ]]; then
  echo "Không có service nào để deploy."
  exit 0
fi

RAW="$*"
RAW="${RAW//,/ }"
read -ra SERVICES <<<"$RAW"

needs_backend=false
needs_ai_service=false
for svc in "${SERVICES[@]}"; do
  case "$svc" in
    auth-service|mail-service|profile-service|location-service|inventory-service|booking-service|traefik|second-life-ui)
      needs_backend=true
      ;;
    product-service)
      needs_backend=true
      needs_ai_service=true
      ;;
    ai-service)
      needs_ai_service=true
      ;;
  esac
done

if [[ "$needs_backend" == true ]]; then
  echo "=== Đảm bảo kafka + redis đang chạy ==="
  "${COMPOSE[@]}" up -d kafka redis
fi

if [[ "$needs_ai_service" == true ]]; then
  contains_ai=false
  for svc in "${SERVICES[@]}"; do
    [[ "$svc" == "ai-service" ]] && contains_ai=true
  done
  if [[ "$contains_ai" == false ]]; then
    echo "=== Đảm bảo ai-service đang chạy (dependency của product-service) ==="
    "${COMPOSE[@]}" up -d ai-service
  fi
fi

BUILD_SERVICES=()
UP_TRAEFIK=false

for svc in "${SERVICES[@]}"; do
  case "$svc" in
    traefik)
      UP_TRAEFIK=true
      ;;
    second-life-ui)
      BUILD_SERVICES+=("$svc")
      ;;
    auth-service|mail-service|profile-service|location-service|product-service|inventory-service|booking-service|ai-service)
      BUILD_SERVICES+=("$svc")
      ;;
    *)
      echo "Service không hỗ trợ: ${svc}" >&2
      exit 1
      ;;
  esac
done

if [[ ${#BUILD_SERVICES[@]} -gt 0 ]]; then
  echo "=== Build (${#BUILD_SERVICES[@]} services, parallel) ==="
  echo "${BUILD_SERVICES[*]}"
  DOCKER_BUILDKIT=1 COMPOSE_PARALLEL_LIMIT=2 "${COMPOSE[@]}" build --parallel "${BUILD_SERVICES[@]}"

  UP_ORDER=()
  for svc in ai-service product-service; do
    for s in "${BUILD_SERVICES[@]}"; do
      [[ "$s" == "$svc" ]] && UP_ORDER+=("$s")
    done
  done
  for s in "${BUILD_SERVICES[@]}"; do
  case "$s" in
    ai-service|product-service) ;;
    *) UP_ORDER+=("$s") ;;
  esac
  done

  for svc in "${UP_ORDER[@]}"; do
    echo "=== Up: ${svc} ==="
    "${COMPOSE[@]}" up -d --no-deps "$svc"
  done
fi

if [[ "$UP_TRAEFIK" == true ]]; then
  echo "=== Up: traefik ==="
  "${COMPOSE[@]}" up -d traefik
fi

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
