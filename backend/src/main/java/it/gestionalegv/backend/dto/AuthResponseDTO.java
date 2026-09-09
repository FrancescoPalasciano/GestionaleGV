package it.gestionalegv.backend.dto;

/**
 * Risposta di autenticazione contenente il token JWT.
 */
public class AuthResponseDTO {

    private String token;
    private String type = "Bearer";
    private Long id;
    private String email;

    public AuthResponseDTO(String token, Long id, String email) {
        this.token = token;
        this.id = id;
        this.email = email;
    }

    // --- Getters & Setters ---

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
