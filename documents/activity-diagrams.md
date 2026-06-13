# Sơ đồ hoạt động — luồng nổi bật

Các luồng chính của hệ thống **Second Life**, dùng cho báo cáo đồ án. Chi tiết sequence diagram theo từng service: [architecture.md](./architecture.md) và README từng microservice.

| Luồng | Actor | Services liên quan |
|-------|-------|-------------------|
| [Tìm kiếm sản phẩm](#1-tìm-kiếm-sản-phẩm) | GUEST / USER | productservice, OpenSearch |
| [Mua hàng (BUY)](#2-mua-hàng-buy) | USER | productservice, bookingservice, inventoryservice, mailservice |
| [Thuê sản phẩm (RENT)](#3-thuê-sản-phẩm-rent) | USER | productservice, bookingservice, inventoryservice, mailservice |
| [Đăng ký & đăng nhập](#4-đăng-ký--đăng-nhập) | GUEST → USER | authservice, profileservice, mailservice |
| [Đăng ký tài khoản LOCAL](#7-đăng-ký-tài-khoản-local-email--password) | GUEST → USER | authservice, profileservice, mailservice |
| [Người bán đăng listing](#5-người-bán-đăng-listing) | USER (seller) | productservice, inventoryservice, locationservice |
| [Admin duyệt listing](#6-admin-duyệt-listing) | ADMIN | productservice, OpenSearch |
| [Chat với cửa hàng](#8-chat-với-cửa-hàng-facility) | USER (buyer / seller) | mailservice, productservice |
| [Chat hỗ trợ Admin](#9-chat-hỗ-trợ-admin) | USER / ADMIN | mailservice |

---

## 1. Tìm kiếm sản phẩm

GUEST và USER đều truy cập `/search` mà không bắt buộc đăng nhập. USER đã đăng nhập có thêm lưu lịch sử tìm kiếm.

```mermaid
flowchart TD
  Start([Bắt đầu]) --> A[Người dùng mở trang /search]
  A --> B[Nhập từ khóa, bộ lọc<br/>danh mục, giá, vị trí]
  B --> C[Gửi GET /api/v1/listings/search]
  C --> D{Đã đăng nhập?}
  D -->|Có| E[Traefik gửi kèm X-Profile-Id]
  D -->|Không| F[Traefik chuyển tiếp công khai]
  E --> G[productservice truy vấn OpenSearch]
  F --> G
  G --> H[Lọc listingStatus=ACTIVE<br/>productStatus=PUBLISHED]
  H --> I[Trả về danh sách phân trang]
  I --> J{USER đã đăng nhập?}
  J -->|Có| K[Lưu lịch sử tìm kiếm bất đồng bộ]
  J -->|Không| L[Hiển thị kết quả]
  K --> L
  L --> M{Chọn một listing?}
  M -->|Có| N[Chuyển /listing/:id]
  M -->|Không| B
  N --> End([Kết thúc])
```

Chi tiết: [productservice/README.md](../productservice/README.md#public-listing-search)

---

## 2. Mua hàng (BUY)

USER phải đăng nhập. Luồng: thêm giỏ → chọn sản phẩm → checkout → giữ tồn kho → tạo đơn → thông báo.

```mermaid
flowchart TD
  Start([Bắt đầu]) --> A[USER xem chi tiết listing ACTIVE]
  A --> B{Đã đăng nhập?}
  B -->|Không| C[Chuyển hướng /login]
  C --> End1([Kết thúc])
  B -->|Có| D[Thêm vào giỏ POST /cart]
  D --> E[Mở /cart, chọn sản phẩm mua]
  E --> F[Chuyển /checkout]
  F --> G[Nhập thông tin người nhận]
  G --> H[Gửi POST /api/v1/orders]
  H --> I[bookingservice kiểm tra tồn kho<br/>GET /availability?mode=BUY]
  I --> J{Đủ hàng?}
  J -->|Không| K[Trả lỗi INSUFFICIENT_INVENTORY]
  K --> End2([Kết thúc — thất bại])
  J -->|Có| L[inventoryservice giữ hàng<br/>POST /reservations/buy]
  L --> M[Lưu BookingOrder vào DB]
  M --> N{Lưu DB thành công?}
  N -->|Không| O[Giải phóng reservation]
  O --> End2
  N -->|Có| P[Gửi thông báo ORDER_CREATED qua Kafka]
  P --> Q[Cập nhật orderCount facility]
  Q --> R[Hiển thị đơn thành công /orders]
  R --> End3([Kết thúc — thành công])
```

Chi tiết: [bookingservice/README.md](../bookingservice/README.md#buy--checkout-flow-user) · [inventoryservice/README.md](../inventoryservice/README.md#end-to-end-user-buys-buy)

---

## 3. Thuê sản phẩm (RENT)

Tương tự BUY nhưng USER chọn khoảng thời gian thuê; hệ thống kiểm tra slot trống trong khoảng đó.

```mermaid
flowchart TD
  Start([Bắt đầu]) --> A[USER xem listing loại RENT]
  A --> B{Đã đăng nhập?}
  B -->|Không| C[Chuyển hướng /login]
  C --> End1([Kết thúc])
  B -->|Có| D[Thêm vào giỏ với ngày bắt đầu/kết thúc]
  D --> E[Mở /cart, chọn sản phẩm thuê + khoảng ngày]
  E --> F[Chuyển /checkout]
  F --> G[Nhập thông tin người thuê]
  G --> H[Gửi POST /api/v1/rental-orders]
  H --> I{Khoảng thuê hợp lệ?}
  I -->|Không| J[Trả lỗi INVALID_INPUT]
  J --> End2([Kết thúc — thất bại])
  I -->|Có| K[Kiểm tra slot trống<br/>GET /availability-in-range?mode=RENT]
  K --> L{Đủ slot trong khoảng thuê?}
  L -->|Không| M[Trả lỗi INSUFFICIENT_INVENTORY]
  M --> End2
  L -->|Có| N[Giữ slot POST /reservations/rent]
  N --> O[Lưu RentalOrder status=PENDING]
  O --> P{Lưu DB thành công?}
  P -->|Không| Q[Giải phóng reservation]
  Q --> End2
  P -->|Có| R[Gửi thông báo ORDER_CREATED]
  R --> S[Hiển thị đơn thuê /orders]
  S --> T{Seller xác nhận / từ chối?}
  T -->|Từ chối / USER hủy| U[DELETE reservation, status=CANCELLED]
  T -->|Xác nhận| V[PENDING → CONFIRMED → … → COMPLETED]
  U --> End3([Kết thúc])
  V --> End3
```

Chi tiết: [bookingservice/README.md](../bookingservice/README.md#rent--checkout-flow-user) · [inventoryservice/README.md](../inventoryservice/README.md#end-to-end-user-rents-rent)

---

## 4. Đăng ký & đăng nhập

GUEST đăng ký hoặc đăng nhập để trở thành USER; profile được tạo bất đồng bộ qua Kafka. Chi tiết đăng ký **LOCAL (email + password)**: [mục 7](#7-đăng-ký-tài-khoản-local-email--password).

```mermaid
flowchart TD
  Start([Bắt đầu]) --> A{Luồng nào?}
  A -->|Đăng ký email| B[Nhập email, mật khẩu]
  A -->|Google OAuth| C[Chuyển hướng Google]
  A -->|Đăng nhập| D[Nhập email/mật khẩu hoặc OAuth]
  B --> E[authservice tạo tài khoản]
  C --> F[OAuth callback]
  F --> E
  E --> G[Publish Kafka profile.create]
  G --> H[profileservice tạo Profile]
  H --> I[Publish auth.account-profile-linked]
  I --> J[authservice gắn profile_id]
  E --> K{Email cần xác minh?}
  K -->|Có| L[Gửi email xác minh qua mailservice]
  L --> M[USER mở link /email-verified]
  K -->|Không| N[Đăng nhập ngay]
  M --> N
  D --> O{Thông tin hợp lệ?}
  O -->|Không| P[Trả lỗi xác thực]
  P --> End1([Kết thúc])
  O -->|Có| Q[Cấp JWT]
  N --> Q
  Q --> R[Traefik forward-auth inject X-Profile-Id, role]
  R --> S[USER truy cập /cart, /manage, …]
  S --> End2([Kết thúc — thành công])
```

Chi tiết: [authservice/README.md](../authservice/README.md) · [profileservice/README.md](../profileservice/README.md)

---

## 5. Người bán đăng listing

USER (seller) chuẩn bị sản phẩm, facility, rồi tạo listing ở trạng thái PENDING.

```mermaid
flowchart TD
  Start([Bắt đầu]) --> A[USER mở /manage]
  A --> B[Tạo Product DRAFT POST /products]
  B --> C[Upload ảnh thumbnail]
  C --> D[Publish product POST /products/id/publish]
  D --> E{Tạo facility chưa?}
  E -->|Chưa| F[POST /facilities<br/>validate vị trí qua locationservice]
  E -->|Rồi| G[Tạo listing POST /listings]
  F --> G
  G --> H{Product PUBLISHED<br/>và facility thuộc seller?}
  H -->|Không| I[Trả lỗi]
  I --> End1([Kết thúc — thất bại])
  H -->|Có| J[Lưu Listing status=PENDING]
  J --> K[Đồng bộ OpenSearch]
  K --> L[Publish Kafka inventory.item.create]
  L --> M[inventoryservice tạo InventoryItem]
  M --> N[Listing chờ ADMIN duyệt]
  N --> End2([Kết thúc — chờ duyệt])
```

Chi tiết: [productservice/README.md](../productservice/README.md#end-to-end-seller-publishes-a-listing)

---

## 6. Admin duyệt listing

ADMIN xem listing PENDING, phê duyệt hoặc từ chối; listing ACTIVE mới hiển thị trên search.

```mermaid
flowchart TD
  Start([Bắt đầu]) --> A[ADMIN mở /admin/listings/pending]
  A --> B[GET /listings/admin/pending]
  B --> C[Hiển thị danh sách PENDING]
  C --> D{Quyết định?}
  D -->|Phê duyệt| E[POST /listings/admin/id/approve]
  D -->|Từ chối| F[POST /listings/admin/id/reject]
  E --> G[listingStatus → ACTIVE]
  F --> H[listingStatus → REJECTED]
  G --> I[Đồng bộ OpenSearch]
  H --> I
  I --> J{ACTIVE?}
  J -->|Có| K[Listing hiển thị trên /search<br/>GUEST/USER có thể mua/thuê]
  J -->|Không| L[Seller có thể sửa và gửi lại PENDING]
  K --> End1([Kết thúc])
  L --> End1
```

Chi tiết: [productservice/README.md](../productservice/README.md#admin-moderation)

---

## 7. Đăng ký tài khoản LOCAL (email + password)

GUEST đăng ký bằng email/mật khẩu (`authProvider = LOCAL`). Không cấp JWT ngay — phải xác minh email trước khi đăng nhập.

```mermaid
flowchart TD
  Start([Bắt đầu]) --> A[GUEST mở /register]
  A --> B[Nhập email và mật khẩu]
  B --> C[Gửi POST /api/v1/auth/register]
  C --> D{Email đã tồn tại?}
  D -->|Đã đăng ký LOCAL| E[Lỗi EMAIL_ALREADY_EXISTS]
  D -->|Đã đăng ký Google| F[Lỗi EMAIL_REGISTERED_WITH_GOOGLE]
  E --> End1([Kết thúc — thất bại])
  F --> End1
  D -->|Email mới| G[authservice lưu Account LOCAL<br/>emailVerified = false]
  G --> H[Publish Kafka profile.create]
  H --> I[profileservice tạo Profile]
  I --> J[Publish Kafka auth.account-profile-linked]
  J --> K[authservice gắn profile_id vào Account]
  G --> L[Publish Kafka mail.email-verification]
  L --> M[mailservice gửi email xác minh]
  M --> N[Trả 200 — không có accessToken]
  N --> O[GUEST mở link xác minh trong email]
  O --> P[GET /api/v1/auth/verify-email?verificationToken=…]
  P --> Q{Token hợp lệ?}
  Q -->|Không| End1
  Q -->|Có| R[Cập nhật emailVerified = true]
  R --> S[Cấp accessToken + refreshToken]
  S --> T[Redirect /email-verified]
  T --> U[UI lưu cookie JWT]
  U --> V[Trở thành USER — truy cập /cart, /manage, …]
  V --> End2([Kết thúc — thành công])
```

**Đăng nhập sau khi đã xác minh:** `POST /auth/login` → nếu email chưa verify thì gửi lại email xác minh (không cấp token); nếu đã verify thì cấp JWT.

Chi tiết: [authservice/README.md](../authservice/README.md#register--email--password) · [profileservice/README.md](../profileservice/README.md)

---

## 8. Chat với cửa hàng (FACILITY)

USER (người mua) nhắn tin với chủ cửa hàng; seller thấy cùng thread ở tab **Khách**. Tin nhắn realtime qua WebSocket.

```mermaid
flowchart TD
  Start([Bắt đầu]) --> A{Điểm vào?}
  A -->|Từ listing/facility| B[Deep link /messages?facilityId=…]
  A -->|Từ menu| C[Mở /messages tab Cơ sở hoặc Khách]
  B --> D{Đã đăng nhập?}
  C --> D
  D -->|Không| E[Chuyển hướng /login]
  E --> End1([Kết thúc])
  D -->|Có| F{Thread FACILITY đã tồn tại?}
  F -->|Chưa — buyer| G[POST /conversations với facilityId]
  G --> H[productservice trả ownerId, tên cửa hàng]
  H --> I[mailservice upsert ConversationDocument<br/>type = FACILITY]
  F -->|Rồi| J[GET /conversations?role=buyer hoặc seller]
  I --> K[Hiển thị danh sách và nội dung chat]
  J --> K
  K --> L[USER soạn tin nhắn<br/>text / ảnh / product card / order card]
  L --> M[POST /conversations/id/messages]
  M --> N[Lưu MessageDocument vào MongoDB]
  N --> O[Cập nhật preview và unreadByBuyer hoặc unreadBySeller]
  O --> P[WebSocket push type MESSAGE tới người nhận]
  P --> Q[Người nhận nhận tin realtime + toast]
  Q --> R{Tiếp tục chat?}
  R -->|Có| L
  R -->|Không| S[PATCH /conversations/id/read]
  S --> End2([Kết thúc])
```

Chi tiết: [mailservice/README.md](../mailservice/README.md#buyerseller-messaging-facility)

---

## 9. Chat hỗ trợ Admin

USER liên hệ ban quản trị qua tab **Admin**; mọi ADMIN dùng chung inbox `/admin/messages`.

```mermaid
flowchart TD
  Start([Bắt đầu]) --> A{Actor?}
  A -->|USER| B[Mở /messages tab Admin]
  A -->|ADMIN| C[Mở /admin/messages]
  B --> D{Đã đăng nhập?}
  D -->|Không| E[Chuyển hướng /login]
  E --> End1([Kết thúc])
  D -->|Có| F{Thread ADMIN đã tồn tại?}
  F -->|Chưa| G[POST /conversations/admin]
  G --> H[mailservice tạo ConversationDocument<br/>type = ADMIN, seller = __ADMIN_INBOX__]
  F -->|Rồi| I[GET /conversations?role=admin-support]
  H --> J[USER gửi tin nhắn hỗ trợ]
  I --> J
  J --> K[POST /conversations/id/messages]
  K --> L[Lưu message, unreadBySeller++]
  L --> M[WebSocket push tới __ADMIN_INBOX__]
  M --> N[ADMIN thấy tin trong inbox]
  C --> O[GET /conversations?role=admin]
  O --> P[ADMIN chọn thread của USER]
  P --> Q[ADMIN trả lời tin nhắn]
  Q --> R[Lưu message, unreadByBuyer++]
  R --> S[WebSocket push tới profileId USER]
  S --> T[USER nhận phản hồi realtime]
  T --> U{Tiếp tục?}
  U -->|Có| V{Ai gửi tiếp?}
  V -->|USER| J
  V -->|ADMIN| Q
  U -->|Không| W[PATCH /conversations/id/read]
  W --> End2([Kết thúc])
```

Chi tiết: [mailservice/README.md](../mailservice/README.md#useradmin-support-messaging-admin)

---

## Liên kết use case & kiến trúc

- Use case theo role: [use-cases.md](./use-cases.md)
- Kiến trúc tổng thể & event bus: [architecture.md](./architecture.md)
- draw.io gốc: [diagrams/](../diagrams/README.md)
