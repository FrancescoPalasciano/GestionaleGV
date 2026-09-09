package it.gestionalegv.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entità che rappresenta una fascia di prezzo Gratta e Vinci configurata per uno specifico Tabacchino.
 */
@Entity
@Table(name = "gv_price_tier", uniqueConstraints = {
    @UniqueConstraint(name = "uk_tabacchino_gv_price", columnNames = {"tabacchino_id", "price"})
})
public class GvPriceTier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tabacchino_id", nullable = false)
    private Tabacchino tabacchino;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public GvPriceTier() {
    }

    public GvPriceTier(Tabacchino tabacchino, BigDecimal price) {
        this.tabacchino = tabacchino;
        this.price = price;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
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
