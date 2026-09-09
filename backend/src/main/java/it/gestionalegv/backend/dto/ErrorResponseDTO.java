package it.gestionalegv.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.OffsetDateTime;
import java.util.Map;

/**
 * Risposta di errore standard — formato uniforme per tutta l'API.
 *
 * Esempio JSON:
 * {
 *   "status": 409,
 *   "error": "Conflitto",
 *   "message": "Email già registrata",
 *   "timestamp": "2026-09-09T01:30:00+02:00",
 *   "details": { "email": "Formato email non valido" }   // solo per errori di validazione
 * }
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponseDTO {

    private int status;
    private String error;
    private String message;
    private String timestamp;
    private Map<String, String> details;

    public ErrorResponseDTO(int status, String error, String message) {
        this.status = status;
        this.error = error;
        this.message = message;
        this.timestamp = OffsetDateTime.now().toString();
    }

    public ErrorResponseDTO(int status, String error, String message, Map<String, String> details) {
        this(status, error, message);
        this.details = details;
    }

    // --- Getters & Setters ---

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public Map<String, String> getDetails() {
        return details;
    }

    public void setDetails(Map<String, String> details) {
        this.details = details;
    }
}
