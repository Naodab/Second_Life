# Production — secondlifeonline.xyz

## Architecture

**Traefik** listens on 80 (redirect to HTTPS) and 443 (Let's Encrypt TLS-ALPN-01).

| Path | Target |
|------|--------|
| `/api/v1/auth*`, OAuth | auth-service :8081 |
| `/api/v1/profiles*` | profile-service :8082 |
| `/api/test*` | mail-service :8083 |
| `/api/v1/provinces`, `/api/v1/wards` | location-service :8085 |
| `/api/v1/facilities`, categories, products, listings, AI | product-service :8086 |
| `/api/v1/listing-variants` | inventory-service :8087 |
| `/api/v1/customers`, `/api/v1/orders` | booking-service :8088 |
| `/` | second-life-ui (static SPA) |

**In Docker network:** Kafka, Redis. **External:** managed MySQL, managed OpenSearch (`OPENSEARCH_*` in `.env`).

No host nginx required.

## Prerequisites

| Item | Notes |
|------|--------|
| Docker 26+ | Compose plugin included |
| Ports 80, 443 | Open on firewall |
| Managed MySQL | Aiven, RDS, etc. |
| Managed OpenSearch | e.g. Aiven |
| DNS | `@` and `www` → VPS IP |

## Configuration

1. Clone repo on the VPS.
2. Copy `.env.production.example` to `.env` (never commit `.env`).
3. Google OAuth redirect: `https://secondlifeonline.xyz/oauth2/callback/google`
4. Import DB schemas before first run (`ddl-auto=validate`).
5. Import location DB from the locationservice data archive.
6. Add CI deploy SSH key to the deploy user when using GitHub Actions.

Variables: see `.env.production.example`. Leave `VITE_BACKEND_URL` empty for same-origin API via Traefik.

## First-time init

When `.env` and DNS are ready, run the **production init script** on the server, or GitHub Actions **Deploy Production** with **init_vps**.

Init will: start Kafka/Redis → build all backends + UI → wait for health → start Traefik → create `.deploy-initialized` marker.

Typical duration: 5–15 minutes. TLS after Traefik is up on 443.

| Service | Auto seed |
|---------|-----------|
| auth-service | Admin from `ACCOUNT_ADMIN_*` |
| product-service | Categories/attributes if empty; OpenSearch indexes |

## Updates

After init, use the **production deploy script** with a comma-separated list of Compose service names (`product-service`, `second-life-ui`, `traefik`, etc.). Requires `.deploy-initialized`.

## CI/CD

Workflow: `.github/workflows/deploy-production.yml`

| Trigger | Effect |
|---------|--------|
| Push `main` | Deploy only changed services (VPS must be initialized) |
| `init_vps` | Full init on VPS |
| `deploy_all` | Rebuild all app services + Traefik |

Secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_DEPLOY_PATH`; optional `VPS_DEPLOY_BRANCH` (default `main`).

| Changed paths | Service |
|---------------|---------|
| `authservice/` | auth-service |
| `mailservice/` | mail-service |
| `profileservice/` | profile-service |
| `locationservice/` | location-service |
| `productservice/` | product-service |
| `inventoryservice/` | inventory-service |
| `bookingservice/` | booking-service |
| `ui/` | second-life-ui |
| `traefik/` | traefik |
| `pom.xml`, `commonjpa/`, `commonservice/` | all backends |
| `docker-compose*.yml` | traefik |

Unrelated paths (e.g. `scripts/pricing/`) do not trigger deploy. Detection: `scripts/ci/detect-changed-services.sh`.

## Troubleshooting CI: `VPS not initialized`

Push `main` chạy `deploy-production.sh`, script yêu cầu file **`.deploy-initialized`** tại thư mục deploy trên VPS (ví dụ `/opt/second-life`). File này **không** nằm trong git (`.gitignore`).

| Tình huống | Cách xử lý |
|------------|------------|
| Chưa từng init | Actions → **Deploy Production** → bật **init_vps**, hoặc SSH: `./scripts/ci/init-production.sh` |
| Đã chạy Docker thủ công / init cũ không tạo marker | Script deploy tự tạo marker nếu phát hiện `traefik`, `auth-service`, `second-life-ui` hoặc `kafka` đang chạy; hoặc SSH: `date -u +%Y-%m-%dT%H:%M:%SZ > .deploy-initialized` |
| Sai `VPS_DEPLOY_PATH` | Secret trỏ khác thư mục clone thực tế → marker và `.env` không khớp |

Log `entrypoint.sh` / drone-ssh từ bước **Deploy selective** là bình thường; lỗi xảy ra ngay sau `git pull` khi thiếu marker và stack chưa chạy.

## Verification

- HTTP → HTTPS redirect (301)
- Categories API returns JSON (200)
- Home page returns SPA (200)

Check Compose logs on the VPS for TLS or service errors.

## Related files

| File | Role |
|------|------|
| `docker-compose.prod.yml` | Prod overlay |
| `.env.production.example` | Env template |
| `traefik/traefik.prod.yml`, `traefik/dynamic.prod.yml` | Gateway |
| `ui/artifacts/second-life/Dockerfile` | UI image |
| `*/application-prod.yml.example` | Spring prod profile |
| `scripts/ci/init-production.sh` | First-time setup |
| `scripts/ci/deploy-production.sh` | Selective redeploy |
| `scripts/ci/detect-changed-services.sh` | Change detection |
