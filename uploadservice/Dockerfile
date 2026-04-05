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
COPY uploadservice/pom.xml uploadservice/pom.xml

# download dependencies (persist ~/.m2 across builds via BuildKit cache)
RUN --mount=type=cache,target=/root/.m2 \
    mvn -pl authservice -am dependency:go-offline -B

# copy source code
COPY commonjpa commonjpa
COPY commonservice commonservice
COPY uploadservice uploadservice

# build
RUN --mount=type=cache,target=/root/.m2 \
    mvn -pl uploadservice -am clean package -DskipTests -B

# ===== RUNTIME =====
FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=builder /build/uploadservice/target/*.jar app.jar

ENTRYPOINT ["java","-jar","app.jar"]
