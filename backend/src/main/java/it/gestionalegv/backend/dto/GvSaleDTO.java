package it.gestionalegv.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class GvSaleDTO {

    private Long id;
    private BigDecimal price;
    private Integer quantity;
    private LocalDate saleDate;
    private LocalDateTime updatedAt;

    public GvSaleDTO() {
    }

    public GvSaleDTO(Long id, BigDecimal price, Integer quantity, LocalDate saleDate, LocalDateTime updatedAt) {
        this.id = id;
        this.price = price;
        this.quantity = quantity;
        this.saleDate = saleDate;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public LocalDate getSaleDate() {
        return saleDate;
    }

    public void setSaleDate(LocalDate saleDate) {
        this.saleDate = saleDate;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
