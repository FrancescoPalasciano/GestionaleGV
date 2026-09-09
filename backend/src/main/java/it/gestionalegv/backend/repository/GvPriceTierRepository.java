package it.gestionalegv.backend.repository;

import it.gestionalegv.backend.model.GvPriceTier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface GvPriceTierRepository extends JpaRepository<GvPriceTier, Long> {

    List<GvPriceTier> findByTabacchinoIdOrderByPriceAsc(Long tabacchinoId);

    Optional<GvPriceTier> findByTabacchinoIdAndPrice(Long tabacchinoId, BigDecimal price);

    boolean existsByTabacchinoIdAndPrice(Long tabacchinoId, BigDecimal price);

    void deleteByTabacchinoIdAndPrice(Long tabacchinoId, BigDecimal price);
}
