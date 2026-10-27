package it.gestionalegv.backend.service;

import it.gestionalegv.backend.dto.GvInvoiceImportRequest;
import it.gestionalegv.backend.dto.GvInvoiceLineDTO;
import it.gestionalegv.backend.dto.GvPurchaseDTO;
import it.gestionalegv.backend.dto.GvSinglesPurchaseRequest;
import it.gestionalegv.backend.model.GvPriceTier;
import it.gestionalegv.backend.model.GvPurchase;
import it.gestionalegv.backend.model.GvTransactionLog;
import org.mockito.ArgumentCaptor;
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
import static org.mockito.ArgumentMatchers.any;
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
    private GvPriceTierRepository priceTierRepository;
    private TabacchinoRepository tabacchinoRepository;
    private GvService service;

    @BeforeEach
    void setUp() {
        priceTierRepository = mock(GvPriceTierRepository.class);
        saleRepository = mock(GvSaleRepository.class);
        winningRepository = mock(GvWinningRepository.class);
        transactionRepository = mock(GvTransactionLogRepository.class);
        purchaseRepository = mock(GvPurchaseRepository.class);
        tabacchinoRepository = mock(TabacchinoRepository.class);
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

    @Test
    void importingInvoiceStoresRealPacksTicketsAndAmountsAndCreatesMissingTiers() {
        Tabacchino owner = tabacchino(1L);
        when(tabacchinoRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(purchaseRepository.findByTabacchinoIdAndDeletedFalseOrderByPurchaseDateDesc(1L)).thenReturn(List.of());
        when(priceTierRepository.existsByTabacchinoIdAndPrice(1L, new BigDecimal("20.00"))).thenReturn(true);
        when(purchaseRepository.save(any(GvPurchase.class))).thenAnswer(inv -> inv.getArgument(0));

        GvInvoiceImportRequest request = new GvInvoiceImportRequest();
        request.setOrderNumber("20221513");
        request.setPurchaseDate(LocalDate.of(2026, 10, 26));
        request.setLines(List.of(
                new GvInvoiceLineDTO(new BigDecimal("0.50"), "Fortuna in Tasca", 1, 200, new BigDecimal("100")),
                new GvInvoiceLineDTO(new BigDecimal("20"), "100X NEW", 2, 30, new BigDecimal("600"))
        ));

        List<GvPurchaseDTO> created = service.importInvoice(1L, request);

        assertEquals(2, created.size());
        GvPurchaseDTO first = created.get(0);
        assertEquals(1, first.getPacksCount());
        assertEquals(200, first.getTickets());
        assertEquals(new BigDecimal("100"), first.getAmount());
        assertEquals(new BigDecimal("0.50"), first.getPrice());
        assertEquals(LocalDate.of(2026, 10, 26), first.getPurchaseDate());
        assertTrue(first.getDescription().startsWith("Fortuna in Tasca"));
        assertTrue(first.getDescription().endsWith("Ordine Lottomatica n. 20221513"));
        assertEquals(2, created.get(1).getPacksCount());

        ArgumentCaptor<GvPriceTier> tier = ArgumentCaptor.forClass(GvPriceTier.class);
        verify(priceTierRepository).save(tier.capture());
        assertEquals(new BigDecimal("0.50"), tier.getValue().getPrice());
    }

    @Test
    void importingSameInvoiceTwiceIsRejected() {
        GvPurchase existing = new GvPurchase();
        existing.setDescription("Buondi · 1 stecca da € 1,00 (150 pz) · Ordine Lottomatica n. 20221513");
        when(purchaseRepository.findByTabacchinoIdAndDeletedFalseOrderByPurchaseDateDesc(1L)).thenReturn(List.of(existing));

        GvInvoiceImportRequest request = new GvInvoiceImportRequest();
        request.setOrderNumber("20221513");
        request.setLines(List.of(new GvInvoiceLineDTO(new BigDecimal("1"), "Buondi", 1, 150, new BigDecimal("150"))));

        assertThrows(IllegalStateException.class, () -> service.importInvoice(1L, request));
        verify(purchaseRepository, never()).save(any());
    }

    @Test
    void addingSingleTicketsStoresFaceValueWithoutStecche() {
        Tabacchino owner = tabacchino(1L);
        when(tabacchinoRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(priceTierRepository.existsByTabacchinoIdAndPrice(1L, new BigDecimal("5.00"))).thenReturn(true);
        when(purchaseRepository.save(any(GvPurchase.class))).thenAnswer(inv -> inv.getArgument(0));

        GvSinglesPurchaseRequest request = new GvSinglesPurchaseRequest();
        request.setPrice(new BigDecimal("5"));
        request.setTickets(12);
        request.setPurchaseDate(LocalDate.of(2026, 10, 27));

        GvPurchaseDTO created = service.addSinglesPurchase(1L, request);

        assertEquals(0, created.getPacksCount());
        assertEquals(12, created.getTickets());
        assertEquals(new BigDecimal("60.00"), created.getAmount());
        assertEquals(new BigDecimal("5.00"), created.getPrice());
        assertEquals(LocalDate.of(2026, 10, 27), created.getPurchaseDate());
        assertEquals("12 biglietti singoli da € 5,00", created.getDescription());
        verify(priceTierRepository, never()).save(any());
    }

    @Test
    void removingASteccaNeverTouchesSingleTickets() {
        Tabacchino owner = tabacchino(1L);
        when(tabacchinoRepository.findById(1L)).thenReturn(Optional.of(owner));
        GvPurchase singles = new GvPurchase(owner, new BigDecimal("60.00"), 0, null, "12 biglietti singoli da € 5,00", LocalDate.now());
        singles.setPrice(new BigDecimal("5.00"));
        singles.setTickets(12);
        GvPurchase stecca = new GvPurchase(owner, new BigDecimal("300.00"), 1, null, "1 stecca da € 5,00 (60 pz)", LocalDate.now());
        stecca.setPrice(new BigDecimal("5.00"));
        when(purchaseRepository.findByTabacchinoIdAndDeletedFalseOrderByPurchaseDateDesc(1L)).thenReturn(List.of(singles, stecca));

        service.addSteccaPurchase(1L, new BigDecimal("5.00"), -1);

        assertEquals(false, singles.getDeleted());
        assertTrue(stecca.getDeleted());
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
