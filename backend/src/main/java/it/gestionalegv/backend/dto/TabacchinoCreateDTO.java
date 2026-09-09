package it.gestionalegv.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO per le richieste di creazione / registrazione.
 * Contiene tutti i campi raccolti nel form di registrazione frontend.
 */
public class TabacchinoCreateDTO {

    @NotBlank(message = "L'email è obbligatoria")
    @Email(message = "Formato email non valido")
    private String email;

    @NotBlank(message = "La password è obbligatoria")
    @Size(min = 8, max = 72, message = "La password deve avere tra 8 e 72 caratteri")
    private String password;

    // Dati anagrafici del titolare
    @NotBlank(message = "Il nome è obbligatorio")
    private String nome;

    @NotBlank(message = "Il cognome è obbligatorio")
    private String cognome;

    // Dati della rivendita
    @NotBlank(message = "La ragione sociale è obbligatoria")
    private String ragioneSociale;

    @NotBlank(message = "Il codice fiscale è obbligatorio")
    private String codiceFiscale;

    private String partitaIva;
    private String codiceRivendita;
    private String telefono;
    private String indirizzo;

    public TabacchinoCreateDTO() {
    }

    // --- Getters & Setters ---

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getCognome() {
        return cognome;
    }

    public void setCognome(String cognome) {
        this.cognome = cognome;
    }

    public String getRagioneSociale() {
        return ragioneSociale;
    }

    public void setRagioneSociale(String ragioneSociale) {
        this.ragioneSociale = ragioneSociale;
    }

    public String getCodiceFiscale() {
        return codiceFiscale;
    }

    public void setCodiceFiscale(String codiceFiscale) {
        this.codiceFiscale = codiceFiscale;
    }

    public String getPartitaIva() {
        return partitaIva;
    }

    public void setPartitaIva(String partitaIva) {
        this.partitaIva = partitaIva;
    }

    public String getCodiceRivendita() {
        return codiceRivendita;
    }

    public void setCodiceRivendita(String codiceRivendita) {
        this.codiceRivendita = codiceRivendita;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getIndirizzo() {
        return indirizzo;
    }

    public void setIndirizzo(String indirizzo) {
        this.indirizzo = indirizzo;
    }
}
