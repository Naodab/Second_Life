# locationservice

Vietnamese administrative data (provinces, wards/communes, administrative units) and **GIS maps** (JTS Geometry: bbox, polygon). Redis-backed caching.

## Stack

| Component | Version / notes |
| --- | --- |
| Java | 21 |
| Spring Boot | Web, Data JPA, Cache |
| MySQL | Connector + spatial columns (`POLYGON`, `MULTIPOLYGON SRID 4326`) |
| Redis | Cache |
| JTS Core | 1.20.0 (geometry) |
| OpenAPI | springdoc |
| Lombok | |
| Internal deps | `commonjpa`, `commonservice` |

## Data model (JPA)

In source, **`AdministrativeRegion`** is a standalone entity (no JPA relationship to other tables in this service).

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

## Main flows

Base path: `/api/v1`. Province/ward reads are **Redis-cached** (`@Cacheable`).

### Province / ward lookup

Used by checkout (**bookingservice**), facility forms (**productservice**), and the UI.

```mermaid
sequenceDiagram
  participant C as Caller (UI / booking / product)
  participant L as LocationService
  participant R as Redis
  participant DB as MySQL

  C->>L: GET /provinces/{code} or GET /wards/{code}
  L->>R: Cache lookup
  alt cache miss
    L->>DB: ProvinceRepository / WardRepository
    L->>R: Store cache entry
  end
  L-->>C: ProvinceResponse / WardResponse
```

### Reverse geocoding (coordinates → ward)

```mermaid
sequenceDiagram
  participant P as ProductService
  participant L as LocationService
  participant GIS as gis_wards (spatial)

  P->>L: GET /wards/lon-lat?lon=&lat=
  L->>GIS: ST_Contains(geom, POINT) ORDER BY distance
  GIS-->>L: Matching ward(s) + nested province
  L-->>P: WardResponse[]
  P->>P: Resolve provinceCode + wardCode for facility
```

### Facility pin validation (point-in-polygon)

```mermaid
sequenceDiagram
  participant P as ProductService
  participant L as LocationService
  participant GIS as gis_wards

  P->>L: GET /provinces/{p}/wards/{w}/valid-location?latitude=&longitude=
  L->>GIS: COUNT WHERE ward/province codes match AND ST_Contains(geom, POINT)
  GIS-->>L: count > 0
  L-->>P: true / false
  alt false
    P-->>P: Reject facility create/update
  end
```

## Common environment variables

| Variable | Description |
|------|--------|
| `SERVER_PORT_LOCATION_SERVICE` | HTTP port |
| `MYSQL_URL` / `MYSQL_USERNAME` / `MYSQL_PASSWORD` | Administrative + GIS data |
| `REDIS_*` | Cache for province/ward reads |
