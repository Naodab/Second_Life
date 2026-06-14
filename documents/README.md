# System documentation

Technical documentation and diagrams for **Second Life**. The root README focuses on product overview, tech stack, and deployment.

| Document | Contents |
|----------|----------|
| [use-cases.md](./use-cases.md) | GUEST / USER / ADMIN use case diagrams, UI route map |
| [architecture.md](./architecture.md) | Microservices architecture, service catalog, Traefik, Kafka, end-to-end flows |
| [activity-diagrams.md](./activity-diagrams.md) | Activity diagrams — search, buy/rent, auth, LOCAL register, chat, seller listing, admin approval |
| [bao-cao-phone-price-v10.md](./bao-cao-phone-price-v10.md) | Phụ lục đồ án — module gợi ý giá điện thoại AI (mục 1.4, 2.5, 3.4; EDA + hình ảnh) |

## Per-service READMEs

Each microservice includes ER diagrams and sequence diagrams for its main flows:

- [authservice](../authservice/README.md) — registration, login, OAuth, JWT
- [profileservice](../profileservice/README.md) — user profiles
- [productservice](../productservice/README.md) — catalog, listings, search
- [inventoryservice](../inventoryservice/README.md) — stock, reservations
- [bookingservice](../bookingservice/README.md) — buy / rent orders
- [mailservice](../mailservice/README.md) — email, notifications, messaging
- [locationservice](../locationservice/README.md) — provinces / wards, GIS

## draw.io diagrams

`.drawio` source files and exported images: [`diagrams/`](../diagrams/README.md).
