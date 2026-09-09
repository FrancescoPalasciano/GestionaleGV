package it.gestionalegv.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class GvWinningDTO {

    private Long id;
    private BigDecimal amount;
    private String tier;
    private String type;
    private String timeRecorded;
    private LocalDateTime recordedAt;
    private String note;

    public GvWinningDTO() {
    }

    public GvWinningDTO(Long id, BigDecimal amount, String tier, String type, String timeRecorded, LocalDateTime recordedAt, String note) {
        this.id = id;
        this.amount = amount;
        this.tier = tier;
        this.type = type;
        this.timeRecorded = timeRecorded;
        this.recordedAt = recordedAt;
        this.note = note;
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

    public String getTier() {
        return tier;
    }

    public void setTier(String tier) {
        this.tier = tier;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
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

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
