package it.gestionalegv.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entità che memorizza gli acquisti e forniture di Gratta e Vinci (forniture da Lotterie Nazionali/distributori).
 * Alimentano la metrica "ACQUISTATI" della Dashboard.
 */
@Entity
@Table(name = "gv_purchase", indexes = {
    @Index(name = "idx_gv_purchase_tabacchino_date", columnList = "tabacchino_id, purchase_date, deleted")
})
public class GvPurchase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tabacchino_id", nullable = false)
    private Tabacchino tabacchino;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    private Integer quantity;

    @Column(name = "price", precision = 10, scale = 2)
    private BigDecimal price;

    @Column(length = 100)
    private String supplier;

    @Column(length = 255)
    private String description;

    @Column(name = "purchase_date", nullable = false)
    private LocalDate purchaseDate;

    @Column(name = "deleted")
    private Boolean deleted = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public GvPurchase() {
    }

    public GvPurchase(Tabacchino tabacchino, BigDecimal amount, Integer quantity, String supplier, String description, LocalDate purchaseDate) {
        this.tabacchino = tabacchino;
        this.amount = amount;
        this.quantity = quantity;
        this.supplier = supplier != null ? supplier : "Lotterie Nazionali";
        this.description = description != null ? description : "Fornitura pacchi Gratta e Vinci";
        this.purchaseDate = purchaseDate != null ? purchaseDate : LocalDate.now();
        this.deleted = false;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.purchaseDate == null) {
            this.purchaseDate = LocalDate.now();
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

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
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

    public Boolean getDeleted() {
        return Boolean.TRUE.equals(deleted);
    }

    public void setDeleted(Boolean deleted) {
        this.deleted = deleted;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public LocalDateTime getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(LocalDateTime deletedAt) {
        this.deletedAt = deletedAt;
    }
}
