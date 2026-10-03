package it.gestionalegv.backend.service;

import it.gestionalegv.backend.model.GvTransactionLog;
import it.gestionalegv.backend.model.GvWinning;
import it.gestionalegv.backend.dto.GvStatisticsDTO;
import it.gestionalegv.backend.model.Tabacchino;
import it.gestionalegv.backend.repository.GvPriceTierRepository;
import it.gestionalegv.backend.repository.GvPurchaseRepository;
import it.gestionalegv.backend.repository.GvSaleRepository;
import it.gestionalegv.backend.repository.GvTransactionLogRepository;
import it.gestionalegv.backend.repository.GvWinningRepository;
import it.gestionalegv.backend.repository.TabacchinoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GvServiceTest {

    private GvWinningRepository winningRepository;
    private GvTransactionLogRepository transactionRepository;
    private GvSaleRepository saleRepository;
    private GvPurchaseRepository purchaseRepository;
    private GvService service;

    @BeforeEach
    void setUp() {
        GvPriceTierRepository priceTierRepository = mock(GvPriceTierRepository.class);
        saleRepository = mock(GvSaleRepository.class);
        winningRepository = mock(GvWinningRepository.class);
        transactionRepository = mock(GvTransactionLogRepository.class);
        purchaseRepository = mock(GvPurchaseRepository.class);
        TabacchinoRepository tabacchinoRepository = mock(TabacchinoRepository.class);
        service = new GvService(priceTierRepository, saleRepository, winningRepository,
                transactionRepository, purchaseRepository, tabacchinoRepository);
    }

    @Test
    void deletingLegacyWinningLogNeverDeletesWinningWithCoincidentId() {
        Tabacchino owner = tabacchino(1L);
        GvTransactionLog transaction = transaction(owner, "win", null);
        when(transactionRepository.findById(10L)).thenReturn(Optional.of(transaction));

        service.deleteTransaction(1L, 10L);

        assertTrue(transaction.getDeleted());
        verify(transactionRepository).save(transaction);
        verify(winningRepository, never()).findById(anyLong());
    }

    @Test
    void deletingLinkedWinningLogDeletesOnlyTheRelatedWinning() {
        Tabacchino owner = tabacchino(1L);
        GvTransactionLog transaction = transaction(owner, "win", 42L);
        GvWinning winning = new GvWinning();
        winning.setTabacchino(owner);
        when(transactionRepository.findById(10L)).thenReturn(Optional.of(transaction));
        when(winningRepository.findById(42L)).thenReturn(Optional.of(winning));

        service.deleteTransaction(1L, 10L);

        assertTrue(winning.getDeleted());
        verify(winningRepository).save(winning);
        verify(winningRepository, never()).findById(10L);
    }

    @Test
    void userCannotDeleteAnotherStoresTransaction() {
        GvTransactionLog transaction = transaction(tabacchino(2L), "win", 42L);
        when(transactionRepository.findById(10L)).thenReturn(Optional.of(transaction));

        assertThrows(IllegalArgumentException.class, () -> service.deleteTransaction(1L, 10L));
        verify(transactionRepository, never()).save(transaction);
        verify(winningRepository, never()).findById(anyLong());
    }

    @ParameterizedTest
    @CsvSource({
            "2026-09-28, 2026-09-28, 2026-10-04",
            "2026-10-04, 2026-09-28, 2026-10-04",
            "2027-01-01, 2026-12-28, 2027-01-03"
    })
    void weeklyStatisticsCoverMondayThroughSundayAcrossMonthAndYearBoundaries(
            LocalDate reference, LocalDate start, LocalDate end) {
        GvTransactionLog sale = transaction(tabacchino(1L), "gv_add", null);
        sale.setRecordedAt(start.atTime(10, 0));
        sale.setPrice(new BigDecimal("5"));
        sale.setQuantity(3);
        GvTransactionLog correction = transaction(tabacchino(1L), "gv_sub", null);
        correction.setRecordedAt(start.atTime(11, 0));
        correction.setPrice(new BigDecimal("5"));
        correction.setQuantity(1);
        GvWinning winning = new GvWinning();
        winning.setRecordedAt(end.atTime(23, 59));
        winning.setAmount(new BigDecimal("4"));
        winning.setType("single");
        when(transactionRepository.findByTabacchinoIdAndRecordedAtBetweenAndDeletedFalseOrderByRecordedAtDesc(
                1L, start.atStartOfDay(), end.atTime(LocalTime.MAX)))
                .thenReturn(List.of(sale, correction));
        when(winningRepository.findByTabacchinoIdAndRecordedAtBetweenAndDeletedFalseOrderByRecordedAtDesc(
                1L, start.atStartOfDay(), end.atTime(LocalTime.MAX)))
                .thenReturn(List.of(winning));

        GvStatisticsDTO stats = service.getStatistics(1L, "week", reference);

        assertEquals("week", stats.getPeriod());
        assertEquals(reference.toString(), stats.getReferenceDate());
        assertTrue(stats.getPeriodLabel().contains(String.valueOf(start.getYear())));
        assertTrue(stats.getPeriodLabel().contains(String.valueOf(end.getYear())));
        assertEquals(new BigDecimal("10"), stats.getTotalRevenue());
        assertEquals(new BigDecimal("0.80"), stats.getTotalAggio());
        assertEquals(new BigDecimal("4"), stats.getTotalWinnings());
        assertEquals(new BigDecimal("6"), stats.getNetCashFlow());
        assertEquals(7, stats.getChartPoints().size());
        assertEquals("lun", stats.getChartPoints().get(0).getLabel());
        assertEquals("dom", stats.getChartPoints().get(6).getLabel());
        assertEquals(new BigDecimal("10"), stats.getChartPoints().get(0).getRevenue());
        assertEquals(2, stats.getChartPoints().get(0).getTickets());
        assertEquals(BigDecimal.ZERO, stats.getChartPoints().get(1).getRevenue());
        assertEquals(new BigDecimal("4"), stats.getChartPoints().get(6).getWinnings());
        verify(saleRepository).findByTabacchinoIdAndSaleDateBetweenAndDeletedFalse(1L, start, end);
        verify(purchaseRepository).findByTabacchinoIdAndPurchaseDateBetweenAndDeletedFalse(1L, start, end);
    }

    private static Tabacchino tabacchino(Long id) {
        Tabacchino tabacchino = new Tabacchino();
        tabacchino.setId(id);
        return tabacchino;
    }

    private static GvTransactionLog transaction(Tabacchino owner, String type, Long relatedId) {
        GvTransactionLog transaction = new GvTransactionLog();
        transaction.setTabacchino(owner);
        transaction.setType(type);
        transaction.setRelatedEntityId(relatedId);
        return transaction;
    }
}
