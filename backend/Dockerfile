FROM maven:3.9-eclipse-temurin-21

WORKDIR /workspace

# Cache dipendenze Maven
COPY pom.xml ./
RUN mvn dependency:go-offline -B || true

# Copia del codice sorgente
COPY src ./src

EXPOSE 8080

CMD ["mvn", "spring-boot:run"]
