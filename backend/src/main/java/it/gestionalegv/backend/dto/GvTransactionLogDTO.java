package it.gestionalegv.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class GvTransactionLogDTO {

    private Long id;
    private String type;
    private BigDecimal price;
    private Integer quantity;
    private BigDecimal amount;
    private String tier;
    private String label;
    private String timeRecorded;
    private LocalDateTime recordedAt;

    public GvTransactionLogDTO() {
    }

    public GvTransactionLogDTO(Long id, String type, BigDecimal price, Integer quantity, BigDecimal amount,
                               String tier, String label, String timeRecorded, LocalDateTime recordedAt) {
        this.id = id;
        this.type = type;
        this.price = price;
        this.quantity = quantity;
        this.amount = amount;
        this.tier = tier;
        this.label = label;
        this.timeRecorded = timeRecorded;
        this.recordedAt = recordedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public LocalDateTime getRecordedAt() {
        return recordedAt;
    }

    public void setRecordedAt(LocalDateTime recordedAt) {
        this.recordedAt = recordedAt;
    }
}
