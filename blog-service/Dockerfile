FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -q -B package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/blog-service-0.0.1-SNAPSHOT.jar /app/app.jar
EXPOSE 8082
ENV SERVER_PORT=8082
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
