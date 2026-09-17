package it.gestionalegv.backend.dto;

/**
 * DTO di risposta — non include mai la password.
 */
public class TabacchinoResponseDTO {

    private Long id;
    private String email;
    private Boolean active;
    private String nome;
    private String cognome;
    private String ragioneSociale;
    private String codiceFiscale;
    private String partitaIva;
    private String codiceRivendita;
    private String telefono;
    private String indirizzo;

    public TabacchinoResponseDTO() {
    }

    public TabacchinoResponseDTO(Long id, String email, Boolean active, String nome, String cognome,
                                 String ragioneSociale, String codiceFiscale, String partitaIva,
                                 String codiceRivendita, String telefono, String indirizzo) {
        this.id = id;
        this.email = email;
        this.active = active;
        this.nome = nome;
        this.cognome = cognome;
        this.ragioneSociale = ragioneSociale;
        this.codiceFiscale = codiceFiscale;
        this.partitaIva = partitaIva;
        this.codiceRivendita = codiceRivendita;
        this.telefono = telefono;
        this.indirizzo = indirizzo;
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

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getCognome() { return cognome; }
    public void setCognome(String cognome) { this.cognome = cognome; }
    public String getRagioneSociale() { return ragioneSociale; }
    public void setRagioneSociale(String ragioneSociale) { this.ragioneSociale = ragioneSociale; }
    public String getCodiceFiscale() { return codiceFiscale; }
    public void setCodiceFiscale(String codiceFiscale) { this.codiceFiscale = codiceFiscale; }
    public String getPartitaIva() { return partitaIva; }
    public void setPartitaIva(String partitaIva) { this.partitaIva = partitaIva; }
    public String getCodiceRivendita() { return codiceRivendita; }
    public void setCodiceRivendita(String codiceRivendita) { this.codiceRivendita = codiceRivendita; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public String getIndirizzo() { return indirizzo; }
    public void setIndirizzo(String indirizzo) { this.indirizzo = indirizzo; }
}
