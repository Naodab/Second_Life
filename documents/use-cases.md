# Use cases — GUEST, USER, ADMIN

Three roles: **GUEST** (no JWT), **USER** (`role = USER`), **ADMIN** (`role = ADMIN`). Traefik forward-auth injects `X-Profile-Id` and `role` after authentication; public GET endpoints work without a JWT.

## Role relationships

```mermaid
flowchart LR
  guest((GUEST<br/>Anonymous visitor))
  user((USER<br/>Signed-in user))
  admin((ADMIN<br/>Platform operator))

  guest -->|"register / sign in"| user
  user -->|"account with role=ADMIN"| admin

  subgraph inherit["Use case inheritance"]
    direction TB
    i1["USER ⊃ all GUEST browse + auth use cases"]
    i2["USER can be both buyer and seller on one profile"]
    i3["ADMIN ⊃ notifications; adds /admin panel"]
  end
```

## Route map by role

```mermaid
flowchart TB
  subgraph public["Public — GUEST & USER"]
    r_home["/"]
    r_search["/search"]
    r_listing["/listing/:id"]
    r_facility["/facility/:id"]
    r_login["/login · /register"]
  end

  subgraph auth_only["Sign-in required — USER"]
    r_cart["/cart"]
    r_checkout["/checkout"]
    r_orders["/orders"]
    r_messages["/messages"]
    r_profile["/profile/setup"]
    r_manage["/manage/*"]
  end

  subgraph admin_only["ADMIN only"]
    r_admin["/admin/*"]
  end

  guest((GUEST)) --> public
  guest -.->|"redirect /login"| auth_only

  user((USER)) --> public
  user --> auth_only

  admin((ADMIN)) --> public
  admin --> auth_only
  admin --> admin_only
```

## GUEST — use cases

```mermaid
flowchart LR
  g((GUEST))

  subgraph explore["Browse — no JWT required"]
    e1["Home & recommendations<br/>/ · POST /listings/recommendations"]
    e2["Search listings<br/>/search · GET /listings/search"]
    e3["Listing & shop detail<br/>/listing/:id · /facility/:id"]
    e4["Provinces / wards<br/>GET /provinces · /wards"]
  end

  subgraph onboard["Onboarding"]
    o1["Register email / Google<br/>/register"]
    o2["Sign in / OAuth<br/>/login"]
    o3["Forgot password<br/>POST /auth/forgot-password"]
    o4["Verify email<br/>/email-verified"]
  end

  g --> e1 & e2 & e3 & e4
  g --> o1 & o2 & o3 & o4
```

## USER — use cases

```mermaid
flowchart TB
  u((USER))

  subgraph profile["Profile"]
    p1["Complete profile<br/>/profile/setup"]
    p2["Update profile<br/>PUT /profiles/{id}"]
  end

  subgraph buyer["Buyer — buy & rent"]
    b1["Shopping cart<br/>/cart"]
    b2["Checkout BUY / RENT<br/>/checkout · POST /orders"]
    b3["My orders<br/>/orders"]
    b4["Realtime notifications<br/>GET /notifications · WS"]
    b5["Chat with facility<br/>/messages · Facilities tab"]
    b6["Admin support<br/>/messages · Admin tab"]
  end

  subgraph seller["Seller hub"]
    s1["Manage facilities<br/>/manage/facilities/*"]
    s2["Products & publish<br/>/manage/products"]
    s3["Create listing PENDING<br/>/manage/add-listing"]
    s4["Reply to customers<br/>/messages · Customers tab"]
    s5["Facility orders<br/>/manage/orders"]
  end

  u --> p1 & p2
  u --> b1 & b2 & b3 & b4 & b5 & b6
  u --> s1 & s2 & s3 & s4 & s5

  s3 -.->|"await ADMIN approval"| active["ACTIVE → visible on /search"]
```

## ADMIN — use cases

```mermaid
flowchart TB
  a((ADMIN))

  subgraph listings["Listings /admin/listings"]
    l1["Pending · approve / reject<br/>/admin/listings/pending"]
    l2["All listings · suspend / reactivate<br/>/admin/listings"]
  end

  subgraph catalog["Catalog"]
    c1["All products<br/>/admin/products"]
    c2["All facilities<br/>/admin/facilities"]
    c3["Category · SubCategory · Attribute<br/>CRUD /categories /attributes"]
  end

  subgraph ops["Operations & monitoring"]
    o1["User accounts<br/>/admin/users"]
    o2["Platform-wide orders<br/>/admin/orders"]
    o3["Support inbox<br/>/admin/messages"]
    o4["Reindex · purge<br/>POST /listings/admin/*"]
  end

  a --> l1 & l2
  a --> c1 & c2 & c3
  a --> o1 & o2 & o3 & o4
```

## Cross-role main flow

```mermaid
flowchart LR
  subgraph guest_flow["GUEST"]
    g_browse[Browse & search]
    g_auth[Register / sign in]
  end

  subgraph user_flow["USER"]
    u_buy[Buy / rent]
    u_sell[Create PENDING listing]
    u_chat[Messaging]
  end

  subgraph admin_flow["ADMIN"]
    a_review[Approve → ACTIVE]
    a_support[Support replies]
    a_monitor[Monitor orders & users]
  end

  g_browse --> g_auth
  g_auth --> u_buy
  g_auth --> u_sell
  g_auth --> u_chat
  u_sell --> a_review
  a_review --> g_browse
  u_chat --> a_support
```

Detailed messaging flows (FACILITY + ADMIN): [mailservice/README.md](../mailservice/README.md).
