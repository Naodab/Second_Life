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
    mvn -pl bookingservice -am dependency:go-offline -B

# copy source code
COPY commonjpa commonjpa
COPY commonservice commonservice
COPY bookingservice bookingservice

# build
RUN --mount=type=cache,target=/root/.m2 \
    mvn -pl bookingservice -am clean package -DskipTests -B

# ===== RUNTIME =====
FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=builder /build/bookingservice/target/*.jar app.jar

ENTRYPOINT ["java","-jar","app.jar"]
