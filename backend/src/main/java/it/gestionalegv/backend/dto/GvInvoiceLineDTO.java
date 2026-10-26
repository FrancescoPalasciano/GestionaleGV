package it.gestionalegv.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Riga del dettaglio ordine Lottomatica: un gioco di una fascia di prezzo con pacchi, biglietti e importo.
 */
public class GvInvoiceLineDTO {

    @NotNull(message = "Il prezzo del biglietto è obbligatorio")
    @DecimalMin(value = "0.01", message = "Il prezzo deve essere maggiore di zero")
    private BigDecimal price;

    @NotBlank(message = "Il nome del gioco è obbligatorio")
    @Size(max = 100, message = "Il nome del gioco è troppo lungo")
    private String game;

    @NotNull(message = "Il numero di pacchi è obbligatorio")
    @Min(value = 1, message = "Il numero di pacchi deve essere almeno 1")
    private Integer packs;

    @NotNull(message = "Il numero di biglietti è obbligatorio")
    @Min(value = 1, message = "Il numero di biglietti deve essere almeno 1")
    private Integer tickets;

    @NotNull(message = "L'importo è obbligatorio")
    @DecimalMin(value = "0.01", message = "L'importo deve essere maggiore di zero")
    private BigDecimal amount;

    public GvInvoiceLineDTO() {
    }

    public GvInvoiceLineDTO(BigDecimal price, String game, Integer packs, Integer tickets, BigDecimal amount) {
        this.price = price;
        this.game = game;
        this.packs = packs;
        this.tickets = tickets;
        this.amount = amount;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getGame() {
        return game;
    }

    public void setGame(String game) {
        this.game = game;
    }

    public Integer getPacks() {
        return packs;
    }

    public void setPacks(Integer packs) {
        this.packs = packs;
    }

    public Integer getTickets() {
        return tickets;
    }

    public void setTickets(Integer tickets) {
        this.tickets = tickets;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
}
