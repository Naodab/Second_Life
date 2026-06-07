# Second Life

**Second Life** is a second-hand goods and rental marketplace — connecting buyers with seller facilities. Users can search listings, buy or rent items, and chat with shops; facility owners manage products and orders via the **seller hub**; admins moderate listings and operate the platform.

**Production:** [https://secondlifeonline.xyz](https://secondlifeonline.xyz)

---

## Key features

| Actor | Capabilities |
|-------|--------------|
| **Guest (GUEST)** | Browse home, OpenSearch listings, view listings & shops; register / sign in (email, Google) |
| **User (USER)** | Cart, buy/rent checkout, order tracking; chat with shops and support; seller hub — facilities, products, listings |
| **Admin (ADMIN)** | Approve listings, manage catalog, monitor orders & accounts, support inbox |

Detailed use case diagrams: [documents/use-cases.md](./documents/use-cases.md)

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, TypeScript, TanStack Query, Wouter, Tailwind |
| **Backend** | Java 21, Spring Boot 3.5, Spring Data JPA, Spring Kafka |
| **API Gateway** | Traefik v3 — routing, TLS, forward-auth JWT |
| **Databases** | MySQL (per service), MongoDB (messages & notifications), Redis (location cache) |
| **Search** | OpenSearch (Aiven in production) |
| **Events** | Kafka 7.x — profile provisioning, email, inventory, order notifications |
| **Realtime** | WebSocket (mailservice) |
| **Email** | Spring Mail + Thymeleaf |

Microservices architecture, Kafka topics, Traefik routing: [documents/architecture.md](./documents/architecture.md)

---

## Repository layout (summary)

```
Second_Life/
├── ui/artifacts/second-life/   # Marketplace SPA
├── authservice/ … bookingservice/   # 7 Spring Boot microservices
├── commonservice/, commonjpa/  # Shared libraries
├── documents/                  # System docs & diagrams
├── traefik/                    # Gateway config
├── docker-compose.yml          # Dev stack
└── DEPLOY-PRODUCTION.md        # VPS deployment guide
```

---

## Local development

1. Copy env files: `.env.example` → `.env`, `ui/artifacts/second-life/.env.example` → `.env`.
2. UI: `cd ui && pnpm install`, run Vite from `ui/artifacts/second-life/`.
3. Backend: `docker compose up` — Traefik on `:80`, API at `http://localhost/api/v1/...`.
4. Import province/ward data under `locationservice` before using location APIs.
5. MySQL schemas must exist before services start (`spring.jpa.hibernate.ddl-auto=validate`).

**First-run bootstrap:** `authservice` creates an admin from `ACCOUNT_ADMIN_*`; `productservice` seeds categories/attributes and the OpenSearch `listings` index.

---

## Production

The VPS runs **Docker + Traefik**. **MySQL** and **OpenSearch** are managed externally; **Kafka** and **Redis** run in Compose.

| Resource | Path |
|----------|------|
| Deployment guide | [DEPLOY-PRODUCTION.md](./DEPLOY-PRODUCTION.md) |
| Env template | `.env.production.example` |
| Compose | `docker-compose.yml` + `docker-compose.prod.yml` |
| CI/CD | `scripts/ci/` |

---

## Further reading

| Topic | Link |
|-------|------|
| Documentation index | [documents/README.md](./documents/README.md) |
| Use cases & role diagrams | [documents/use-cases.md](./documents/use-cases.md) |
| Architecture & system flows | [documents/architecture.md](./documents/architecture.md) |
| draw.io diagrams | [diagrams/README.md](./diagrams/README.md) |
| Per-service READMEs | `*/README.md` in each module |
