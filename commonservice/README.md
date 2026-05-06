# commonservice

Thư viện Spring dùng chung (API response, exception, cấu hình JSON, constants). Có lớp `CommonserviceApplication` phục vụ test/bootstrap; **không có JPA entity** trong module này.

## Công nghệ

| Thành phần | Phiên bản / ghi chú |
| --- | --- |
| Java | 21 |
| Spring Boot | `spring-boot-starter`, `spring-boot-starter-web`, `spring-boot-starter-validation` |
| AOP | `spring-boot-starter-aop` |
| OpenAPI UI | springdoc-openapi (webmvc-ui) |
| Lombok | Optional |

## Mô hình dữ liệu (JPA)

**Không có** — module chỉ chứa DTO/exception/config dùng chung.
