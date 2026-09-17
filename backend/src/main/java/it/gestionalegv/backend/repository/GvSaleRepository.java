package it.gestionalegv.backend.repository;

import it.gestionalegv.backend.model.GvSale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface GvSaleRepository extends JpaRepository<GvSale, Long> {

    List<GvSale> findByTabacchinoIdAndSaleDateAndDeletedFalse(Long tabacchinoId, LocalDate saleDate);

    Optional<GvSale> findByTabacchinoIdAndPriceAndSaleDateAndDeletedFalse(Long tabacchinoId, BigDecimal price, LocalDate saleDate);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<GvSale> findByTabacchinoIdAndPriceAndSaleDate(Long tabacchinoId, BigDecimal price, LocalDate saleDate);

    List<GvSale> findByTabacchinoIdAndSaleDateBetweenAndDeletedFalse(Long tabacchinoId, LocalDate start, LocalDate end);

    List<GvSale> findByTabacchinoIdAndSaleDateBetween(Long tabacchinoId, LocalDate start, LocalDate end);

    List<GvSale> findByTabacchinoIdAndSaleDate(Long tabacchinoId, LocalDate saleDate);

    void deleteByTabacchinoIdAndSaleDate(Long tabacchinoId, LocalDate saleDate);
}
