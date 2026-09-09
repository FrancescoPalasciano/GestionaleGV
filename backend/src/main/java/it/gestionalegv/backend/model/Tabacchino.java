package it.gestionalegv.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Entità JPA che rappresenta un tabaccaio registrato nel sistema.
 * I nuovi campi vengono aggiunti automaticamente al DB grazie a ddl-auto=update.
 */
@Entity
@Table(name = "tabacchino")
public class Tabacchino {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(nullable = false)
    private Boolean active = true;

    // ── Dati anagrafici del titolare ────────────────────────────────────
    @Column(length = 100)
    private String nome;

    @Column(length = 100)
    private String cognome;

    // ── Dati della rivendita ────────────────────────────────────────────
    @Column(name = "ragione_sociale", length = 255)
    private String ragioneSociale;

    @Column(name = "codice_fiscale", length = 20)
    private String codiceFiscale;

    @Column(name = "partita_iva", length = 20)
    private String partitaIva;

    @Column(name = "codice_rivendita", length = 50)
    private String codiceRivendita;

    @Column(length = 50)
    private String telefono;

    @Column(length = 500)
    private String indirizzo;

    public Tabacchino() {
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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
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
