# mailservice

Email delivery (Spring Mail + Thymeleaf templates), in-app notifications, buyer–seller messaging, and real-time WebSocket pushes. Consumes Kafka events (e.g. forgot password, email verification).

## Stack

| Component | Version / notes |
| --- | --- |
| Java | 21 |
| Spring Boot | Mail, Thymeleaf, Validation, WebSocket |
| MongoDB | Conversations, messages, notifications |
| Spring Kafka | Event consumers (per environment) |
| OpenAPI | springdoc |
| Lombok | |
| Internal deps | `commonservice` |

## Data model (MongoDB)

Embedded value objects: `MessageProductCard`, `MessageOrderCard` (not separate collections).

```mermaid
erDiagram
    ConversationDocument {
        string id PK
        string buyer_profile_id
        string seller_profile_id
        string facility_id
        string facility_name
        string facility_image_url
        string last_message_preview
        instant last_message_at
        long unread_by_buyer
        long unread_by_seller
        instant created_at
        instant updated_at
    }
    MessageDocument {
        string id PK
        string conversation_id FK
        string sender_profile_id
        string content
        array image_urls
        object product_card
        object order_card
        instant created_at
    }
    NotificationDocument {
        string id PK
        string profile_id
        enum type
        string title
        string body
        string link
        boolean read
        instant created_at
        string order_id
        string order_type
    }
    ConversationDocument ||--o{ MessageDocument : contains
```

| Collection | Description |
| --- | --- |
| `notifications` | Order/system notifications keyed by `profileId` |
| `conversations` | Threads between a buyer and a facility (seller) |
| `messages` | Messages within a conversation |

### Conversations API (`/api/v1/conversations`)

- `GET ?role=buyer|seller` — list conversations
- `POST` `{ "facilityId": "..." }` — create or fetch a conversation with a facility
- `GET /{id}/messages` — message history
- `POST /{id}/messages` `{ "content": "..." }` — send a message
- `PATCH /{id}/read` — mark as read

WebSocket `/api/v1/ws/notifications` pushes `type: "MESSAGE"` events when new messages arrive.

Message payloads support:

- Text (`content`)
- Images (`imageUrls`, uploaded to Cloudinary from the UI)
- Product card (`productCard`: listingId, title, thumbnail, …)
- Order card (`orderCard`: orderId, status, title, …)

## Main flows

Base path: `/api/v1`. WebSocket: `/ws/notifications`.

### Buyer–seller messaging

```mermaid
sequenceDiagram
  participant UI as Frontend
  participant M as MailService
  participant P as ProductService
  participant DB as MongoDB
  participant WS as Recipient WebSocket

  UI->>M: POST /conversations { facilityId }
  M->>P: GET /facilities/{facilityId}
  P-->>M: ownerId, name, imageUrl
  M->>DB: Upsert ConversationDocument (buyer + facility)
  M-->>UI: ConversationResponse

  UI->>M: POST /conversations/{id}/messages { content, imageUrls?, productCard?, orderCard? }
  M->>DB: INSERT MessageDocument
  M->>DB: Update preview + unread counters
  M->>WS: { type: MESSAGE, message, conversation }
  M-->>UI: MessageResponse
```

### Order lifecycle notification (Kafka → in-app + email)

Published by **bookingservice** on order create, confirm, cancel, status change.

```mermaid
sequenceDiagram
  participant B as BookingService
  participant K as Kafka
  participant M as MailService
  participant DB as MongoDB
  participant WS as UI WebSocket
  participant SMTP as SMTP

  B->>K: notification.order-lifecycle
  K->>M: OrderNotificationConsumer
  M->>DB: INSERT NotificationDocument
  M->>WS: { type: NOTIFICATION, notification }
  M->>SMTP: order-notification.html (async, role-filtered)
```

### Auth transactional email

```mermaid
sequenceDiagram
  participant A as AuthService
  participant K as Kafka
  participant M as MailService
  participant SMTP as SMTP

  alt register / resend verification
    A->>K: mail.email-verification
    K->>M: EmailVerificationConsumer
    M->>SMTP: email/email-verification.html
  else forgot password
    A->>K: mail.forgot-password
    K->>M: ForgotPasswordConsumer
    M->>SMTP: forgot-password template
  end
```

### WebSocket handshake

```mermaid
sequenceDiagram
  participant UI as Frontend
  participant M as MailService
  participant A as AuthService (forward-auth)

  UI->>M: WS /ws/notifications (accessToken cookie or X-Profile-Id)
  opt cookie only
    M->>A: GET /auth/forward-auth
    A-->>M: X-Profile-Id
  end
  M->>M: Register session by profileId
```

## Common environment variables

| Variable | Description |
|------|--------|
| `SERVER_PORT_MAIL_SERVICE` | HTTP port |
| `MONGODB_URI` | MongoDB connection |
| `KAFKA_BOOTSTRAP_SERVERS` | Kafka broker |
| `SPRING_MAIL_*` | SMTP settings |
