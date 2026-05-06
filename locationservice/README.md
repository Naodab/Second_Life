# locationservice

Dữ liệu hành chính Việt Nam (tỉnh, phường/xã, đơn vị hành chính) và **bản đồ GIS** (JTS Geometry: bbox, polygon). Cache Redis.

## Công nghệ

| Thành phần | Phiên bản / ghi chú |
| --- | --- |
| Java | 21 |
| Spring Boot | Web, Data JPA, Cache |
| MySQL | Connector + spatial columns (`POLYGON`, `MULTIPOLYGON SRID 4326`) |
| Redis | Cache |
| JTS Core | 1.20.0 (geometry) |
| OpenAPI | springdoc |
| Lombok | |
| Phụ thuộc nội bộ | `commonjpa`, `commonservice` |

## Mô hình dữ liệu (JPA)

Trong source, **`AdministrativeRegion`** là entity độc lập (chưa thấy quan hệ JPA với các bảng khác).

```mermaid
erDiagram
    AdministrativeUnit {
        int id PK
        string full_name
        string full_name_en
        string short_name
        string short_name_en
        string code_name
        string code_name_en
    }
    AdministrativeRegion {
        int id PK
        string name
        string name_en
        string code_name
        string code_name_en
    }
    Province {
        int id PK
        string code
        string name
        string name_en
        string full_name
        string full_name_en
        string code_name
        int administrative_unit_id FK
    }
    Ward {
        int id PK
        string code
        string name
        string name_en
        string full_name
        string full_name_en
        string code_name
        string province_code FK
        int administrative_unit_id FK
    }
    GisProvince {
        int id PK
        string province_code FK
        string gis_server_id
        double area_km2
        polygon bbox
        multipolygon geom
    }
    GisWard {
        int id PK
        string ward_code FK
        string gis_server_id
        decimal area_km2
        polygon bbox
        multipolygon geom
    }
    AdministrativeUnit ||--o{ Province : classifies
    Province ||--o{ Ward : contains
    Province ||--|| GisProvince : maps
    Ward ||--|| GisWard : maps
```
