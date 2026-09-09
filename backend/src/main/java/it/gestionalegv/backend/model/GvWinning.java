package it.gestionalegv.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entità che memorizza le vincite pagate (vincita singola o chiusura totale fine giornata).
 * Supporta soft-delete.
 */
@Entity
@Table(name = "gv_winning", indexes = {
    @Index(name = "idx_gv_winning_tabacchino_date", columnList = "tabacchino_id, recorded_at, deleted")
})
public class GvWinning {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tabacchino_id", nullable = false)
    private Tabacchino tabacchino;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(length = 100)
    private String tier;

    @Column(nullable = false, length = 20)
    private String type; // "single" o "closing"

    @Column(name = "time_recorded", length = 10)
    private String timeRecorded;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;

    @Column(length = 255)
    private String note;

    @Column(name = "deleted")
    private Boolean deleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public GvWinning() {
    }

    public GvWinning(Tabacchino tabacchino, BigDecimal amount, String tier, String type, String timeRecorded, LocalDateTime recordedAt, String note) {
        this.tabacchino = tabacchino;
        this.amount = amount;
        this.tier = tier;
        this.type = type;
        this.timeRecorded = timeRecorded;
        this.recordedAt = recordedAt;
        this.note = note;
        this.deleted = false;
    }

    @PrePersist
    protected void onCreate() {
        if (this.recordedAt == null) {
            this.recordedAt = LocalDateTime.now();
        }
        if (this.deleted == null) {
            this.deleted = false;
        }
    }

    // --- Getters & Setters ---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Tabacchino getTabacchino() {
        return tabacchino;
    }

    public void setTabacchino(Tabacchino tabacchino) {
        this.tabacchino = tabacchino;
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

    public Boolean getDeleted() {
        return Boolean.TRUE.equals(deleted);
    }

    public void setDeleted(Boolean deleted) {
        this.deleted = deleted;
    }

    public LocalDateTime getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(LocalDateTime deletedAt) {
        this.deletedAt = deletedAt;
    }
}
