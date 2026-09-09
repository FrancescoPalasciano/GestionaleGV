package it.gestionalegv.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class GvPurchaseDTO {

    private Long id;
    private BigDecimal amount;
    private Integer packsCount;
    private BigDecimal price;
    private String supplier;
    private String description;
    private LocalDate purchaseDate;
    private LocalDateTime createdAt;

    public GvPurchaseDTO() {
    }

    public GvPurchaseDTO(Long id, BigDecimal amount, Integer packsCount, String supplier, String description, LocalDate purchaseDate, LocalDateTime createdAt) {
        this.id = id;
        this.amount = amount;
        this.packsCount = packsCount;
        this.supplier = supplier;
        this.description = description;
        this.purchaseDate = purchaseDate;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
