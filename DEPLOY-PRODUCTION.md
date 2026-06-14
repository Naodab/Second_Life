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
3. Google Cloud Console — **Authorized redirect URIs** (Google → backend, bắt buộc khớp từng host):
   - `https://secondlifeonline.xyz/api/v1/login/oauth2/code/google`
   - `https://www.secondlifeonline.xyz/api/v1/login/oauth2/code/google`
   - Dev (Traefik cổng 80): `http://localhost/api/v1/login/oauth2/code/google`
   - Dev (Vite): **Authorized JavaScript origins** `http://localhost:5173` — không cần thêm `/oauth2/callback/google` vào Google redirect.
   - `.env`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS` (auth-service tự whitelist `{origin}/oauth2/callback/google` cho www/apex).
4. Import DB schemas before first run (`ddl-auto=validate`).
5. Import location DB from the locationservice data archive.
6. Add CI deploy SSH key to the deploy user when using GitHub Actions.

Variables: see `.env.production.example`. Leave `VITE_BACKEND_URL` empty for same-origin API via Traefik.

### Email verification URLs

| Variable | Role |
|----------|------|
| `GATEWAY_URL` | Public API origin (prod: `https://secondlifeonline.xyz`) |
| `AUTH_SERVICE_PUBLIC_BASE_URL` | `{GATEWAY_URL}/api/v1` — link trong email |
| `FRONTEND_URL` | Redirect sau verify → `{FRONTEND_URL}/email-verified?token=…` |

Link trong email: `{AUTH_SERVICE_PUBLIC_BASE_URL}/auth/verify-email?verificationToken=…` (không phải `/verify-email` trên cổng gateway).

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
| `aiservice/` | ai-service |
| `inventoryservice/` | inventory-service |
| `bookingservice/` | booking-service |
| `ui/` | second-life-ui |
| `traefik/` | traefik |
| `pom.xml`, `commonjpa/`, `commonservice/` | all backends |
| `docker-compose*.yml` | traefik |

Unrelated paths (e.g. `scripts/pricing/`) do not trigger deploy. Detection: `scripts/ci/detect-changed-services.sh`.

## Troubleshooting: `GET /api/v1/listings/search` → 500

Stack trace tại `ListingController.searchListingItems` → `listingSearchService.searchListingsPaged` → **OpenSearch** (index `listings`).

Trên VPS, lấy **dòng `Caused by:`** (phần trên stack trace):

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=200 product-service \
  | grep -E 'Caused by:|OpenSearch|listings|Connection|index_not_found|authentication'
```

| `Caused by` thường gặp | Việc cần làm |
|------------------------|----------------|
| Connection refused / timeout | `OPENSEARCH_URIS` sai; firewall Aiven chưa allow IP VPS |
| Unauthorized / 401 | `OPENSEARCH_USERNAME` / `OPENSEARCH_PASSWORD` trong `.env` |
| SSL / certificate | URI phải `https://...`; kiểm tra CA trên Aiven |
| `index_not_found_exception` | Index chưa có dữ liệu — reindex (bên dưới) |

Kiểm tra biến trong container:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec product-service \
  sh -c 'echo OPENSEARCH_URIS=$OPENSEARCH_URIS'
```

Sau khi OpenSearch kết nối OK, **reindex** (cần JWT admin):

```bash
curl -sS -X POST "https://secondlifeonline.xyz/api/v1/listings/admin/search/reindex" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT"
```

Log startup: `Created OpenSearch index` / `Could not ensure OpenSearch index` — chạy ngay sau deploy `product-service`.

## Troubleshooting CI: `VPS not initialized`

Push `main` chạy `deploy-production.sh`, script yêu cầu file **`.deploy-initialized`** tại thư mục deploy trên VPS (ví dụ `/opt/second-life`). File này **không** nằm trong git (`.gitignore`).

| Tình huống | Cách xử lý |
|------------|------------|
| Chưa từng init | Actions → **Deploy Production** → bật **init_vps**, hoặc SSH: `./scripts/ci/init-production.sh` |
| Đã chạy Docker thủ công / init cũ không tạo marker | Script deploy tự tạo marker nếu phát hiện `traefik`, `auth-service`, `second-life-ui` hoặc `kafka` đang chạy; hoặc SSH: `date -u +%Y-%m-%dT%H:%M:%SZ > .deploy-initialized` |
| Sai `VPS_DEPLOY_PATH` | Secret trỏ khác thư mục clone thực tế → marker và `.env` không khớp |

Log `entrypoint.sh` / drone-ssh từ bước **Deploy selective** là bình thường; lỗi xảy ra ngay sau `git pull` khi thiếu marker và stack chưa chạy.

## Troubleshooting CI: `Run Command Timeout`

`appleboy/ssh-action` mặc định **10 phút** cho toàn bộ script SSH. Build nhiều service Maven trên VPS (đặc biệt khi diff chạm `commonservice/` → deploy 7 backend) dễ vượt giới hạn.

| Cách xử lý | Chi tiết |
|------------|----------|
| Đã cấu hình trong workflow | `command_timeout: 120m`, job `timeout-minutes: 150` |
| Push nhỏ hơn | Chỉ sửa service cần thiết; tránh đổi `commonservice/` nếu không cần rebuild all |
| Deploy thủ công trên VPS | `git pull` rồi `./scripts/ci/deploy-production.sh traefik` (hoặc danh sách service) — không giới hạn 10 phút |
| Deploy all một lần | Actions → **deploy_all** — vẫn cần đủ thời gian; VPS yếu có thể cần chạy script trực tiếp |

## Troubleshooting: Google login → `/oauth2/callback/google` HTTP 404

Đăng nhập Google thành công (URL có `?token=…`) nhưng trang callback 404: Traefik **không** được route `PathPrefix(/oauth2)` tới `auth-service`. Đường `/oauth2/callback/google` là route **SPA** (UI); API OAuth chỉ ở `/api/v1/oauth2/...` và `/api/v1/login/oauth2/...`.

Sau khi sửa `traefik/dynamic.prod.yml`, restart Traefik (file provider watch có thể đủ):

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d traefik
```

## Troubleshooting: `/search`, `/login` → HTTP 404

SPA dùng **static-web-server** với `--page-fallback`. Đường dẫ fallback phải là file thật (ví dụ `/public/index.html`), **không** chỉ `index.html` — nếu sai, mọi deep link (`/search`, `/listing/...`) trả 404 dù `/` vẫn 200.

Sửa xong cần **rebuild** `second-life-ui`:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml build second-life-ui
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d second-life-ui
```

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
