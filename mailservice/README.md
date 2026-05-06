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

## Mô hình dữ liệu (JPA)

**Không có** — luồng xử lý dựa trên DTO event và gửi mail, không persist entity trong service này.
