package it.gestionalegv.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Carico di Gratta e Vinci singoli (biglietti sfusi, non a stecca) per una fascia di prezzo.
 */
public class GvSinglesPurchaseRequest {

    @NotNull(message = "La fascia di prezzo è obbligatoria")
    @DecimalMin(value = "0.01", message = "Il prezzo deve essere maggiore di zero")
    private BigDecimal price;

    @NotNull(message = "Il numero di biglietti è obbligatorio")
    @Min(value = 1, message = "Inserisci almeno un biglietto")
    @Max(value = 10000, message = "Numero di biglietti troppo alto")
    private Integer tickets;

    private LocalDate purchaseDate;

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getTickets() {
        return tickets;
    }

    public void setTickets(Integer tickets) {
        this.tickets = tickets;
    }

    public LocalDate getPurchaseDate() {
        return purchaseDate;
    }

    public void setPurchaseDate(LocalDate purchaseDate) {
        this.purchaseDate = purchaseDate;
    }
}
