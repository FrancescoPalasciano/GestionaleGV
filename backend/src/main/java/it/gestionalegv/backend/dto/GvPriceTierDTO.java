package it.gestionalegv.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class GvPriceTierDTO {

    private Long id;
    private BigDecimal price;
    private LocalDateTime createdAt;

    public GvPriceTierDTO() {
    }

    public GvPriceTierDTO(Long id, BigDecimal price, LocalDateTime createdAt) {
        this.id = id;
        this.price = price;
        this.createdAt = createdAt;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
