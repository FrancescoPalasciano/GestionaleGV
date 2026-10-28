package it.gestionalegv.backend.service;

import it.gestionalegv.backend.dto.DashboardChartPointDTO;
import it.gestionalegv.backend.dto.DashboardStatsDTO;
import it.gestionalegv.backend.model.GvTransactionLog;
import it.gestionalegv.backend.repository.GvPurchaseRepository;
import it.gestionalegv.backend.repository.GvTransactionLogRepository;
import it.gestionalegv.backend.repository.GvWinningRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DashboardServiceTest {

    private final GvWinningRepository winningRepository = mock(GvWinningRepository.class);
    private final GvPurchaseRepository purchaseRepository = mock(GvPurchaseRepository.class);
    private final GvTransactionLogRepository transactionRepository = mock(GvTransactionLogRepository.class);
    private final DashboardService service = new DashboardService(winningRepository, purchaseRepository, transactionRepository);

    @Test
    void todayStatsCompareWithYesterdayAndChartUsesASingleLogQuery() {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);
        LocalDate threeDaysAgo = today.minusDays(3);
        when(transactionRepository.findByTabacchinoIdAndRecordedAtBetweenAndDeletedFalseOrderByRecordedAtDesc(eq(1L), any(), any()))
                .thenReturn(List.of(
                        log("gv_add", "5", 4, today.atTime(10, 0)),
                        log("gv_sub", "5", 1, today.atTime(11, 0)),
                        log("win", null, null, today.atTime(12, 0)),
                        log("gv_add", "10", 1, yesterday.atTime(9, 0)),
                        log("gv_add", "2", 3, threeDaysAgo.atTime(18, 0))
                ));

        DashboardStatsDTO stats = service.getDashboardStats(1L, "today");

        // Oggi: 4 - 1 = 3 biglietti da € 5 → € 15, aggio € 1,20; ieri 1 biglietto (€ 10)
        assertEquals(3, stats.getSoldGv());
        assertEquals(new BigDecimal("1.20"), stats.getPartialProfit());
        assertEquals("up", stats.getSoldGvTrendDirection());
        assertEquals("up", stats.getPartialProfitTrendDirection());

        List<DashboardChartPointDTO> chart = stats.getChartPoints();
        assertEquals(7, chart.size());
        assertEquals(new BigDecimal("15"), chart.get(6).getRevenue());
        assertEquals(3, chart.get(6).getTickets());
        assertEquals(new BigDecimal("10"), chart.get(5).getRevenue());
        assertEquals(3, chart.get(3).getTickets());
        assertEquals(0, chart.get(0).getTickets());

        verify(transactionRepository, times(1)).findByTabacchinoIdAndRecordedAtBetweenAndDeletedFalseOrderByRecordedAtDesc(
                1L, today.minusDays(6).atStartOfDay(), today.atTime(LocalTime.MAX));
        verify(transactionRepository, times(1)).findByTabacchinoIdAndRecordedAtBetweenAndDeletedFalseOrderByRecordedAtDesc(anyLong(), any(), any());
    }

    private static GvTransactionLog log(String type, String price, Integer quantity, LocalDateTime at) {
        BigDecimal p = price != null ? new BigDecimal(price) : null;
        BigDecimal amount = p != null ? p.multiply(BigDecimal.valueOf(quantity)) : new BigDecimal("20");
        return new GvTransactionLog(null, type, p, quantity, amount, null, type, "00:00", at);
    }
}
