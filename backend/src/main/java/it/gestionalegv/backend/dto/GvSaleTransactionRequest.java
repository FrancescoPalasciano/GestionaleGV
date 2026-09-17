package it.gestionalegv.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;

public class GvSaleTransactionRequest {

    @NotNull(message = "Il prezzo è obbligatorio")
    @DecimalMin(value = "0.01", message = "Il prezzo deve essere maggiore di zero")
    private BigDecimal price;

    @NotNull(message = "Il delta quantità è obbligatorio")
    private Integer delta;

    @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Orario non valido")
    private String timeRecorded;

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public Integer getDelta() { return delta; }
    public void setDelta(Integer delta) { this.delta = delta; }
    public String getTimeRecorded() { return timeRecorded; }
    public void setTimeRecorded(String timeRecorded) { this.timeRecorded = timeRecorded; }
}
