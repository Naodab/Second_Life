# authservice

Authentication and account service: registration/login, OAuth2 client, JWT (JJWT), account soft-delete. Links to profiles via `profile_id` (UUID string, cross-service reference — no JPA FK to the profile database).

## Stack

| Component | Version / notes |
| --- | --- |
| Java | 21 |
| Spring Boot | 3.5.11 |
| Web, Validation | REST API |
| Spring Security + OAuth2 Client | Security / social login |
| Spring Data JPA + MySQL | `mysql-connector-j` |
| JJWT | 0.12.5 |
| Google API / OAuth client | Google integration |
| Spring Kafka | Events (producer/consumer per config) |
| OpenAPI | springdoc |
| Lombok | Entities / DTOs |
| Internal deps | `commonjpa`, `commonservice` |

## Data model (JPA)

```mermaid
erDiagram
    Account {
        uuid id PK
        string email UK
        string password
        enum auth_provider
        string provider_id
        enum role
        boolean email_verified
        string refresh_token
        string profile_id UK
        boolean is_active
        string verification_token
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }
```

**Note:** `profile_id` is a cross-service reference to `profileservice`, not a `@ManyToOne` in this codebase.

## Auth flows

Base path: `/api/v1`. Kafka topics: `profile.create`, `auth.account-profile-linked`, `mail.email-verification`.

### Register — email + password

Returns an **empty** `AuthResponse` (no tokens). The user must verify email before logging in.

```mermaid
sequenceDiagram
  participant UI as Frontend
  participant A as AuthService
  participant DB as MySQL (accounts)
  participant K as Kafka
  participant P as ProfileService
  participant M as MailService

  UI->>A: POST /auth/register { email, password }
  A->>DB: Check email not taken
  alt email already registered (LOCAL)
    A-->>UI: EMAIL_ALREADY_EXISTS
  else email registered with Google
    A-->>UI: EMAIL_REGISTERED_WITH_GOOGLE
  else new account
    A->>DB: Save Account (LOCAL, emailVerified=false)
    A->>K: profile.create
    K->>P: CreateProfileConsumer
    P->>P: Save Profile
    P->>K: auth.account-profile-linked
    K->>A: ProfileLinkedToAccountConsumer
    A->>DB: Set account.profile_id
    A->>K: mail.email-verification
    K->>M: Send verification email
    A-->>UI: 200 AuthResponse (no tokens)
  end
```

After the user opens the verification link:

```mermaid
sequenceDiagram
  participant UI as Frontend
  participant A as AuthService
  participant DB as MySQL (accounts)
  participant P as ProfileService

  UI->>A: GET /auth/verify-email?verificationToken=…
  A->>A: Validate JWT verification token
  A->>DB: Load account, set emailVerified=true
  A->>P: GET profile by profile_id
  A->>A: Issue access + refresh JWT
  A->>DB: Store refresh_token
  A-->>UI: 302 → /email-verified?token=…&refresh_token=…
```

### Login — email + password

```mermaid
sequenceDiagram
  participant UI as Frontend
  participant A as AuthService
  participant DB as MySQL (accounts)
  participant K as Kafka
  participant P as ProfileService
  participant M as MailService

  UI->>A: POST /auth/login { email, password }
  A->>DB: Find account by email
  alt user not found or wrong password
    A-->>UI: USER_NOT_FOUND
  else account uses Google (not LOCAL)
    A-->>UI: SIGN_IN_WITH_GOOGLE
  else email not verified
    A->>K: mail.email-verification (resend)
    K->>M: Send verification email
    A-->>UI: 200 AuthResponse (no tokens)
  else verified LOCAL account
    A->>P: GET profile by profile_id
    A->>A: Issue access + refresh JWT
    A->>DB: Store refresh_token
    A-->>UI: 200 { accessToken, refreshToken, profile }
  end
```

Admin accounts skip profile fetch in the login response (`profile = null`).

### Google — login (`oauth_entry=login`)

Entry URL (via gateway):  
`GET /oauth2/authorize/google?redirect_uri={frontendCallback}&oauth_entry=login`

```mermaid
sequenceDiagram
  participant UI as Frontend
  participant A as AuthService
  participant G as Google
  participant DB as MySQL (accounts)
  participant K as Kafka
  participant P as ProfileService

  UI->>A: GET /oauth2/authorize/google?redirect_uri=…&oauth_entry=login
  A->>G: Redirect to Google consent
  G-->>A: GET /login/oauth2/code/google?code=…
  A->>G: Exchange code, fetch userinfo (email, sub, name, …)
  A->>DB: Find or create Account (GOOGLE, emailVerified=true)

  alt email exists with LOCAL provider
    A-->>UI: Redirect /login?oauth_error=different_provider_login
  else existing Google account
    Note over A,DB: Reuse account
  else first-time Google user (login entry)
    A->>DB: Create Account (GOOGLE)
    A->>K: profile.create (with Google profile fields)
    K->>P: Create profile + auth.account-profile-linked
    K->>A: Link profile_id on account
  end

  A->>A: Poll until profile_id linked (≤10s)
  A->>A: Issue access + refresh JWT
  A->>DB: Store refresh_token
  A-->>UI: 302 redirect_uri?token=…&refresh_token=…
  UI->>UI: OAuthCallback stores cookies, navigates home/admin
```

### Google — register (`oauth_entry=register`)

Same OAuth redirect dance; `CustomOAuth2UserService` reads `oauth_entry=register` from cookie.

```mermaid
sequenceDiagram
  participant UI as Frontend
  participant A as AuthService
  participant G as Google
  participant DB as MySQL (accounts)
  participant K as Kafka
  participant P as ProfileService

  UI->>A: GET /oauth2/authorize/google?redirect_uri=…&oauth_entry=register
  A->>G: Redirect to Google consent
  G-->>A: GET /login/oauth2/code/google?code=…
  A->>G: Exchange code, fetch userinfo
  A->>DB: Lookup by provider_id or email

  alt email exists with LOCAL provider
    A-->>UI: Redirect /register?oauth_error=different_provider_register
  else Google account already exists
    A->>K: profile.create (idempotent — re-link if profile exists)
    K->>P: Ensure profile + auth.account-profile-linked
  else brand-new Google account
    A->>DB: Create Account (GOOGLE, emailVerified=true)
    A->>K: profile.create (name, avatar from Google)
    K->>P: Save Profile
    P->>K: auth.account-profile-linked
    K->>A: Set account.profile_id
  end

  A->>A: Poll until profile_id linked (≤10s)
  A->>A: Issue access + refresh JWT
  A->>DB: Store refresh_token
  A-->>UI: 302 redirect_uri?token=…&refresh_token=…
```

Google sign-in **does not** send a verification email (`emailVerified=true` on create). No password is stored.

## Common environment variables

| Variable | Description |
|------|--------|
| `SERVER_PORT_AUTH_SERVICE` | HTTP port (default `8081`) |
| `MYSQL_URL` / `MYSQL_USERNAME` / `MYSQL_PASSWORD` | Account database |
| `JWT_SECRET` | Signing key for access / refresh / verification tokens |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth client |
| `FRONTEND_URL` | SPA base URL (verify-email redirect, OAuth error pages) |
| `KAFKA_BOOTSTRAP_SERVERS` | Kafka broker |
| `PROFILE_SERVICE_URL` | Profile API (login profile fetch) |
