#!/usr/bin/env bash
# Map git diff to docker compose service names.
# Output (GITHUB_OUTPUT nếu có, hoặc stdout):
#   services=auth-service,product-service,...
#   has_changes=true|false
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ALL_BACKEND="auth-service mail-service profile-service location-service product-service inventory-service booking-service"
ALL_DEPLOYABLE="${ALL_BACKEND} ai-service second-life-ui traefik"

resolve_base_head() {
  local base="${1:-}"
  local head="${2:-HEAD}"

  if [[ -n "$base" ]]; then
    echo "$base" "$head"
    return
  fi

  if [[ -n "${GITHUB_EVENT_BEFORE:-}" && "${GITHUB_EVENT_BEFORE}" != "0000000000000000000000000000000000000000" ]]; then
    echo "${GITHUB_EVENT_BEFORE}" "${GITHUB_SHA:-HEAD}"
    return
  fi

  if [[ -n "${GITHUB_EVENT_BEFORE:-}" && "${GITHUB_EVENT_BEFORE}" == "0000000000000000000000000000000000000000" ]]; then
    echo "__first_push__" "${GITHUB_SHA:-HEAD}"
    return
  fi

  if git rev-parse HEAD~1 >/dev/null 2>&1; then
    echo "HEAD~1" "HEAD"
    return
  fi

  echo "__no_base__" "HEAD"
}

contains_service() {
  local list="$1"
  local svc="$2"
  case " $list " in
    *" $svc "*) return 0 ;;
  esac
  return 1
}

add_service() {
  local svc="$1"
  if contains_service "$SERVICES_LIST" "$svc"; then
    return
  fi
  if [[ -z "$SERVICES_LIST" ]]; then
    SERVICES_LIST="$svc"
  else
    SERVICES_LIST="$SERVICES_LIST $svc"
  fi
}

SERVICES_LIST=""
SHARED_BACKEND=false

read -r BASE HEAD < <(resolve_base_head "${1:-}" "${2:-HEAD}")

write_output() {
  local list="$1"
  local has="$2"
  local csv="${list// /,}"

  echo "Changed compose services: ${list:-<none>}" >&2

  if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
    {
      echo "services=${csv}"
      echo "has_changes=${has}"
    } >>"$GITHUB_OUTPUT"
  else
    echo "services=${csv}"
    echo "has_changes=${has}"
  fi
}

deploy_all_list() {
  write_output "$ALL_DEPLOYABLE" "true"
  exit 0
}

case "$BASE" in
  __first_push__)
    echo "First push to branch — deploy all services" >&2
    deploy_all_list
    ;;
  __no_base__)
    echo "Cannot resolve base commit — use deploy_all or init_vps in Actions." >&2
    write_output "" "false"
    exit 0
    ;;
esac

echo "Diff range: ${BASE}..${HEAD}" >&2

CHANGED_FILES="$(git diff --name-only "$BASE" "$HEAD" 2>/dev/null || true)"

if [[ -z "$CHANGED_FILES" ]]; then
  write_output "" "false"
  exit 0
fi

while IFS= read -r file; do
  [[ -z "$file" ]] && continue

  case "$file" in
    pom.xml|commonjpa/*|commonservice/*)
      SHARED_BACKEND=true
      ;;
    authservice/*)
      add_service auth-service
      ;;
    mailservice/*)
      add_service mail-service
      ;;
    profileservice/*)
      add_service profile-service
      ;;
    locationservice/*)
      add_service location-service
      ;;
    productservice/*)
      add_service product-service
      ;;
    aiservice/*)
      add_service ai-service
      ;;
    inventoryservice/*)
      add_service inventory-service
      ;;
    bookingservice/*)
      add_service booking-service
      ;;
    ui/*)
      add_service second-life-ui
      ;;
    traefik/*)
      add_service traefik
      ;;
    docker-compose.yml|docker-compose.prod.yml|docker-compose.dev.yml|.env.production.example)
      add_service traefik
      ;;
    scripts/ci/init-production.sh)
      # Init script đổi → cần workflow init hoặc deploy all thủ công
      ;;
    .github/workflows/deploy-production.yml|scripts/ci/deploy-production.sh|scripts/ci/detect-changed-services.sh)
      ;;
  esac
done <<<"$CHANGED_FILES"

if [[ "$SHARED_BACKEND" == true ]]; then
  for svc in $ALL_BACKEND; do
    add_service "$svc"
  done
fi

if [[ -z "$SERVICES_LIST" ]]; then
  write_output "" "false"
else
  SORTED="$(echo "$SERVICES_LIST" | tr ' ' '\n' | sort | tr '\n' ' ' | sed 's/ $//')"
  write_output "$SORTED" "true"
fi
