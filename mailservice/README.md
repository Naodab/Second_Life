# mailservice

Gửi email (Spring Mail + Thymeleaf templates). Tiêu thụ sự kiện Kafka (ví dụ quên mật khẩu, xác minh email). WebSocket starter có trong dependency (theo `pom.xml`).

## Công nghệ

| Thành phần | Phiên bản / ghi chú |
| --- | --- |
| Java | 21 |
| Spring Boot | Mail, Thymeleaf, Validation |
| Spring Kafka | Consumer (cấu hình theo môi trường) |
| WebSocket | `spring-boot-starter-websocket` |
| OpenAPI | springdoc |
| Lombok | |
| Phụ thuộc nội bộ | `commonservice` |

## Mô hình dữ liệu (MongoDB)

| Collection | Mô tả |
| --- | --- |
| `notifications` | Thông báo đơn hàng / hệ thống theo `profileId` |
| `conversations` | Cuộc trò chuyện giữa buyer và cơ sở (facility) |
| `messages` | Tin nhắn trong từng conversation |

### Conversations API (`/api/v1/conversations`)

- `GET ?role=buyer\|seller` — danh sách hội thoại
- `POST` `{ "facilityId": "..." }` — tạo hoặc lấy hội thoại với cơ sở
- `GET /{id}/messages` — lịch sử tin nhắn
- `POST /{id}/messages` `{ "content": "..." }` — gửi tin
- `PATCH /{id}/read` — đánh dấu đã đọc

WebSocket `/api/v1/ws/notifications` push thêm event `type: "MESSAGE"` khi có tin mới.

Tin nhắn hỗ trợ:
- Văn bản (`content`)
- Ảnh (`imageUrls`, upload Cloudinary từ UI)
- Card sản phẩm (`productCard`: listingId, title, thumbnail, …)
- Card đơn hàng (`orderCard`: orderId, status, title, …)
