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

# download dependencies
RUN mvn -pl profileservice -am dependency:go-offline

# copy source code
COPY commonjpa commonjpa
COPY commonservice commonservice
COPY profileservice profileservice

# build
RUN mvn -pl profileservice -am clean package -DskipTests

# ===== RUNTIME =====
FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=builder /build/profileservice/target/*.jar app.jar

ENTRYPOINT ["java","-jar","app.jar"]
