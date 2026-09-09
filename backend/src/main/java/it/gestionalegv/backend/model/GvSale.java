package it.gestionalegv.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entità che memorizza il totale dei Gratta e Vinci venduti per fascia di prezzo in una specifica data.
 * Include supporto al soft-delete per conservare lo storico delle vendite dopo l'azzeramento giornaliero.
 */
@Entity
@Table(name = "gv_sale", indexes = {
    @Index(name = "idx_gv_sale_tabacchino_date", columnList = "tabacchino_id, sale_date, deleted")
})
public class GvSale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tabacchino_id", nullable = false)
    private Tabacchino tabacchino;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer quantity = 0;

    @Column(name = "sale_date", nullable = false)
    private LocalDate saleDate;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted")
    private Boolean deleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public GvSale() {
    }

    public GvSale(Tabacchino tabacchino, BigDecimal price, Integer quantity, LocalDate saleDate) {
        this.tabacchino = tabacchino;
        this.price = price;
        this.quantity = quantity;
        this.saleDate = saleDate;
        this.deleted = false;
    }

    @PrePersist
    protected void onCreate() {
        this.updatedAt = LocalDateTime.now();
        if (this.saleDate == null) {
            this.saleDate = LocalDate.now();
        }
        if (this.deleted == null) {
            this.deleted = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
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
