package it.gestionalegv.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public class GvTransactionLogCreateRequest {

    @NotBlank(message = "Il tipo transazione è obbligatorio")
    @Pattern(regexp = "gv_add|gv_sub|win|closing", message = "Tipo transazione non valido")
    private String type; // "gv_add", "gv_sub", "win", "closing"

    @DecimalMin(value = "0.01", message = "Il prezzo deve essere maggiore di zero")
    private BigDecimal price;

    @Min(value = 1, message = "La quantità deve essere almeno 1")
    private Integer quantity;

    @NotNull(message = "L'importo è obbligatorio")
    @DecimalMin(value = "0.01", message = "L'importo deve essere maggiore di zero")
    private BigDecimal amount;

    @Size(max = 100, message = "La fascia può contenere al massimo 100 caratteri")
    private String tier;

    @NotBlank(message = "L'etichetta è obbligatoria")
    @Size(max = 255, message = "L'etichetta può contenere al massimo 255 caratteri")
    private String label;

    @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Orario non valido")
    private String timeRecorded;

    private Long relatedEntityId;

    public GvTransactionLogCreateRequest() {
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getTier() {
        return tier;
    }

    public void setTier(String tier) {
        this.tier = tier;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getTimeRecorded() {
        return timeRecorded;
    }

    public void setTimeRecorded(String timeRecorded) {
        this.timeRecorded = timeRecorded;
    }

    public Long getRelatedEntityId() {
        return relatedEntityId;
    }

    public void setRelatedEntityId(Long relatedEntityId) {
        this.relatedEntityId = relatedEntityId;
    }
}
