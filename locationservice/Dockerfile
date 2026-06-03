# syntax=docker/dockerfile:1
# ===== BUILD STAGE =====
FROM maven:3.9.9-eclipse-temurin-21 AS builder
WORKDIR /build

# root pom
COPY pom.xml .

# copy module poms
COPY commonjpa/pom.xml commonjpa/pom.xml
COPY commonservice/pom.xml commonservice/pom.xml
COPY authservice/pom.xml authservice/pom.xml
COPY profileservice/pom.xml profileservice/pom.xml
COPY mailservice/pom.xml mailservice/pom.xml
COPY locationservice/pom.xml locationservice/pom.xml
COPY productservice/pom.xml productservice/pom.xml
COPY inventoryservice/pom.xml inventoryservice/pom.xml
COPY bookingservice/pom.xml bookingservice/pom.xml

# download dependencies (persist ~/.m2 across builds via BuildKit cache)
RUN --mount=type=cache,target=/root/.m2 \
    mvn -pl locationservice -am dependency:go-offline -B

# copy source code
COPY commonjpa commonjpa
COPY commonservice commonservice
COPY locationservice locationservice

RUN cp locationservice/src/main/resources/application-prod.yml.example \
    locationservice/src/main/resources/application-prod.yml

# build
RUN --mount=type=cache,target=/root/.m2 \
    mvn -pl locationservice -am clean package -DskipTests -B

# ===== RUNTIME =====
FROM eclipse-temurin:21-jre
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY --from=builder /build/locationservice/target/*.jar app.jar

ENTRYPOINT ["java","-jar","app.jar"]
