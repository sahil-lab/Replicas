FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /workspace/services/api
ENV MAVEN_OPTS="-Xmx384m -XX:ActiveProcessorCount=2"
COPY services/api/pom.xml .
COPY services/api/src ./src
RUN mvn -B -ntp -DskipTests package

FROM build AS check
CMD ["mvn", "-B", "-ntp", "verify"]

FROM eclipse-temurin:21-jre-alpine AS runtime
RUN addgroup -S app -g 10001 && adduser -S app -u 10001 -G app
WORKDIR /app
COPY --from=build --chown=app:app /workspace/services/api/target/api.jar ./api.jar
USER app:app
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=60 -XX:ActiveProcessorCount=2"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/api.jar"]
