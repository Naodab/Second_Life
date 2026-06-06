# profileservice

User profiles and bank accounts (checkout/payout): `Profile` entity, `Bank` catalog, and `BankAccount` linked to a profile.

## Stack

| Component | Version / notes |
| --- | --- |
| Java | 21 |
| Spring Boot | Web, Validation, Data JPA |
| MySQL | Connector |
| Spring Kafka | Events |
| OpenAPI | springdoc |
| Lombok | |
| Internal deps | `commonjpa`, `commonservice` |

## Data model (JPA)

```mermaid
erDiagram
    Profile {
        uuid id PK
        string email UK
        string phone_number
        string first_name
        string last_name
        string avatar_url
        string role
        string status
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }
    Bank {
        uuid id PK
        string name
        string code
        string logo_url
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }
    BankAccount {
        uuid id PK
        uuid bank_id FK
        uuid profile_id FK
        string account_number
        string account_name
        string qr_code_url
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }
    Bank ||--o{ BankAccount : has
    Profile ||--o{ BankAccount : owns
```

**Note:** Bank account REST APIs are not implemented yet; only entities and service interfaces exist.

## Main flows

Base path: `/api/v1`. Kafka: consume `profile.create`, produce `auth.account-profile-linked`.

### Profile provisioning (signup / OAuth)

Triggered by **authservice** after local register or Google OAuth. See also [authservice README](../authservice/README.md).

```mermaid
sequenceDiagram
  participant A as AuthService
  participant K as Kafka
  participant P as ProfileService
  participant DB as MySQL (profiles)
  participant A2 as AuthService (consumer)

  A->>K: profile.create
  K->>P: CreateProfileConsumer
  alt email empty
    P-->>K: skip
  else profile already exists
    P->>K: auth.account-profile-linked (re-link)
  else new profile
    P->>DB: INSERT Profile
    P->>K: auth.account-profile-linked { email, profileId }
  end
  K->>A2: ProfileLinkedToAccountConsumer
  A2->>A2: Set account.profile_id
```

### Current user profile read / update

Caller headers (`X-Profile-Id`, `X-User-Email`) are injected by Traefik forward-auth from **authservice**.

```mermaid
sequenceDiagram
  participant UI as Frontend
  participant G as Gateway / ForwardAuth
  participant P as ProfileService
  participant DB as MySQL (profiles)

  UI->>G: GET /profiles/me (Bearer JWT)
  G->>G: Validate JWT → X-Profile-Id / X-User-Email
  G->>P: Forward request + headers
  alt X-Profile-Id present
    P->>DB: findById
  else X-User-Email present
    P->>DB: findByEmail
  else missing identity
    P-->>UI: 401 Unauthorized
  end
  P-->>UI: ProfileResponse

  UI->>G: PUT /profiles/me { firstName, lastName, phoneNumber, avatarUrl }
  G->>P: Forward + headers
  P->>DB: Load → merge → UPDATE
  P-->>UI: ProfileResponse
```

## Common environment variables

| Variable | Description |
|------|--------|
| `SERVER_PORT_PROFILE_SERVICE` | HTTP port (default `8082`) |
| `MYSQL_URL` / `MYSQL_USERNAME` / `MYSQL_PASSWORD` | Profile database |
| `KAFKA_BOOTSTRAP_SERVERS` | Kafka broker |
