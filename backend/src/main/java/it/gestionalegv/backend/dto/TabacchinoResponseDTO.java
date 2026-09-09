package it.gestionalegv.backend.dto;

/**
 * DTO di risposta — non include mai la password.
 */
public class TabacchinoResponseDTO {

    private Long id;
    private String email;
    private Boolean active;

    public TabacchinoResponseDTO() {
    }

    public TabacchinoResponseDTO(Long id, String email, Boolean active) {
        this.id = id;
        this.email = email;
        this.active = active;
    }

    // --- Getters & Setters ---

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

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}
