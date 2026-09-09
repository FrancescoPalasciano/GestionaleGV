FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /workspace

# Cache dipendenze Maven
COPY pom.xml ./
RUN mvn dependency:go-offline -B || true

# Copia del codice sorgente e compilazione JAR
COPY src ./src
RUN mvn clean package -DskipTests

# Immagine di esecuzione leggera
FROM eclipse-temurin:21-jre

WORKDIR /app

# Installa curl e wget per garantire il funzionamento degli healthcheck su Coolify e Docker
RUN apt-get update && apt-get install -y --no-install-recommends curl wget && rm -rf /var/lib/apt/lists/*

# Copia il JAR compilato dalla fase di build
COPY --from=build /workspace/target/*.jar /app/app.jar

EXPOSE 8080

HEALTHCHECK --interval=20s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -f -s http://localhost:8080/api/v1/health || exit 1

CMD ["java", "-jar", "app.jar"]
