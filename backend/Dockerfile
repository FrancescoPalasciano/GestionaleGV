FROM maven:3.9-eclipse-temurin-21

WORKDIR /workspace

# Cache dipendenze Maven
COPY pom.xml ./
RUN mvn dependency:go-offline -B || true

# Copia del codice sorgente
COPY src ./src

EXPOSE 8080

HEALTHCHECK --interval=20s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -f -s http://localhost:8080/api/v1/health || exit 1

CMD ["mvn", "spring-boot:run"]
