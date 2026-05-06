# profileservice

Quản lý hồ sơ người dùng và tài khoản ngân hàng (thanh toán): entity `Profile`, danh mục `Bank`, `BankAccount` gắn profile.

## Công nghệ

| Thành phần | Phiên bản / ghi chú |
| --- | --- |
| Java | 21 |
| Spring Boot | Web, Validation, Data JPA |
| MySQL | Connector |
| Spring Kafka | Sự kiện |
| OpenAPI | springdoc |
| Lombok | |
| Phụ thuộc nội bộ | `commonjpa`, `commonservice` |

## Mô hình dữ liệu (JPA)

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
