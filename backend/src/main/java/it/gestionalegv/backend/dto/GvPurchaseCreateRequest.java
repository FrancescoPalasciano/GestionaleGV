package it.gestionalegv.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public class GvPurchaseCreateRequest {

    @NotNull(message = "L'importo dell'acquisto è obbligatorio")
    @DecimalMin(value = "0.01", message = "L'importo deve essere maggiore di zero")
    private BigDecimal amount;

    private Integer packsCount;
    private BigDecimal price;
    private String supplier;
    private String description;
    private LocalDate purchaseDate;

    public GvPurchaseCreateRequest() {
    }

    public GvPurchaseCreateRequest(BigDecimal amount, Integer packsCount, String supplier, String description, LocalDate purchaseDate) {
        this.amount = amount;
        this.packsCount = packsCount;
        this.supplier = supplier;
        this.description = description;
        this.purchaseDate = purchaseDate;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public Integer getPacksCount() {
        return packsCount;
    }

    public void setPacksCount(Integer packsCount) {
        this.packsCount = packsCount;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getSupplier() {
        return supplier;
    }

    public void setSupplier(String supplier) {
        this.supplier = supplier;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDate getPurchaseDate() {
        return purchaseDate;
    }

    public void setPurchaseDate(LocalDate purchaseDate) {
        this.purchaseDate = purchaseDate;
    }
}
