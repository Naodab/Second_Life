FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY . .
RUN mvn -q -DskipTests clean package

# ===== RUNTIME STAGE =====
FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

# ENV bắt buộc
ENV JAVA_OPTS=""

CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar --server.port=$PORT"]
