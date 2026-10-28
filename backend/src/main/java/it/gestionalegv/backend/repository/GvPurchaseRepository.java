package it.gestionalegv.backend.repository;

import it.gestionalegv.backend.model.GvPurchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface GvPurchaseRepository extends JpaRepository<GvPurchase, Long> {

    List<GvPurchase> findByTabacchinoIdAndPurchaseDateBetweenAndDeletedFalse(Long tabacchinoId, LocalDate start, LocalDate end);

    List<GvPurchase> findByTabacchinoIdAndDeletedFalseOrderByPurchaseDateDesc(Long tabacchinoId);

    boolean existsByTabacchinoIdAndDeletedFalseAndDescriptionEndingWith(Long tabacchinoId, String suffix);
}
