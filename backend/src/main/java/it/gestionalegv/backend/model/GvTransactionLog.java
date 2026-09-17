package it.gestionalegv.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entità che memorizza lo storico completo delle transazioni giornaliere Gratta e Vinci
 * (vendite aggregate/singole, storni, vincite e chiusure).
 * Supporta soft-delete.
 */
@Entity
@Table(name = "gv_transaction_log", indexes = {
    @Index(name = "idx_gv_tx_tabacchino_date", columnList = "tabacchino_id, recorded_at, deleted")
})
public class GvTransactionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tabacchino_id", nullable = false)
    private Tabacchino tabacchino;

    @Column(nullable = false, length = 20)
    private String type; // "gv_add", "gv_sub", "win", "closing"

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    private Integer quantity;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(length = 100)
    private String tier;

    @Column(nullable = false, length = 255)
    private String label;

    @Column(name = "time_recorded", nullable = false, length = 10)
    private String timeRecorded;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;

    @Column(name = "related_entity_id")
    private Long relatedEntityId;

    @Column(name = "deleted")
    private Boolean deleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public GvTransactionLog() {
    }

    public GvTransactionLog(Tabacchino tabacchino, String type, BigDecimal price, Integer quantity,
                             BigDecimal amount, String tier, String label, String timeRecorded, LocalDateTime recordedAt) {
        this.tabacchino = tabacchino;
        this.type = type;
        this.price = price;
        this.quantity = quantity;
        this.amount = amount;
        this.tier = tier;
        this.label = label;
        this.timeRecorded = timeRecorded;
        this.recordedAt = recordedAt;
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

    public Long getRelatedEntityId() {
        return relatedEntityId;
    }

    public void setRelatedEntityId(Long relatedEntityId) {
        this.relatedEntityId = relatedEntityId;
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
