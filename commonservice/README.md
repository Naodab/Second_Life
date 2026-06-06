# commonservice

Shared Spring library (API responses, exceptions, JSON config, constants). Includes a `CommonserviceApplication` class for tests/bootstrap; **no JPA entities** in this module.

## Stack

| Component | Version / notes |
| --- | --- |
| Java | 21 |
| Spring Boot | `spring-boot-starter`, `spring-boot-starter-web`, `spring-boot-starter-validation` |
| AOP | `spring-boot-starter-aop` |
| OpenAPI UI | springdoc-openapi (webmvc-ui) |
| Lombok | Optional |

## Data model (JPA)

**None** — this module only contains shared DTOs, exceptions, and configuration.

## Main flows

**N/A** — shared library only. No HTTP endpoints or Kafka consumers. Consumed as a Maven dependency by microservices (`ApiResponse`, `ErrorCode`, `AppException`, order notification event types, etc.).
