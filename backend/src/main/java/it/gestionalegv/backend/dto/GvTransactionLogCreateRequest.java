package it.gestionalegv.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class GvTransactionLogCreateRequest {

    @NotBlank(message = "Il tipo transazione è obbligatorio")
    private String type; // "gv_add", "gv_sub", "win", "closing"

    private BigDecimal price;

    private Integer quantity;

    @NotNull(message = "L'importo è obbligatorio")
    private BigDecimal amount;

    private String tier;

    @NotBlank(message = "L'etichetta è obbligatoria")
    private String label;

    private String timeRecorded;

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
}
