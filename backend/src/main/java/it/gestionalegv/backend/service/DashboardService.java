package it.gestionalegv.backend.service;

import it.gestionalegv.backend.dto.DashboardChartPointDTO;
import it.gestionalegv.backend.dto.DashboardOperationDTO;
import it.gestionalegv.backend.dto.DashboardStatsDTO;
import it.gestionalegv.backend.model.GvPurchase;
import it.gestionalegv.backend.model.GvTransactionLog;
import it.gestionalegv.backend.model.GvWinning;
import it.gestionalegv.backend.repository.GvPurchaseRepository;
import it.gestionalegv.backend.repository.GvTransactionLogRepository;
import it.gestionalegv.backend.repository.GvWinningRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final GvWinningRepository winningRepository;
    private final GvPurchaseRepository purchaseRepository;
    private final GvTransactionLogRepository transactionLogRepository;

    public DashboardService(GvWinningRepository winningRepository,
                            GvPurchaseRepository purchaseRepository,
                            GvTransactionLogRepository transactionLogRepository) {
        this.winningRepository = winningRepository;
        this.purchaseRepository = purchaseRepository;
        this.transactionLogRepository = transactionLogRepository;
    }

    public DashboardStatsDTO getDashboardStats(Long tabacchinoId, String period) {
        if (period == null || period.isBlank()) {
            period = "today";
        }

        LocalDate today = LocalDate.now();
        LocalDate startDate;
        LocalDate endDate;
        LocalDate compStartDate;
        LocalDate compEndDate;
        String compLabel = "vs ieri";
        String periodLabel = "Oggi";

        switch (period.toLowerCase()) {
            case "yesterday":
                startDate = today.minusDays(1);
                endDate = startDate;
                compStartDate = today.minusDays(2);
                compEndDate = compStartDate;
                compLabel = "vs altro ieri";
                periodLabel = "Ieri";
                break;
            case "week":
                startDate = today.with(DayOfWeek.MONDAY);
                endDate = today;
                compStartDate = startDate.minusWeeks(1);
                compEndDate = compStartDate.plusDays(6);
                compLabel = "vs sett. prec.";
                periodLabel = "Questa settimana";
                break;
            case "month":
                startDate = today.withDayOfMonth(1);
                endDate = today;
                compStartDate = startDate.minusMonths(1);
                compEndDate = compStartDate.withDayOfMonth(compStartDate.lengthOfMonth());
                compLabel = "vs mese prec.";
                periodLabel = "Questo mese";
                break;
            case "today":
            default:
                startDate = today;
                endDate = today;
                compStartDate = today.minusDays(1);
                compEndDate = compStartDate;
                compLabel = "vs ieri";
                periodLabel = "Oggi";
                break;
        }

        // Grafico: i 7 giorni della settimana corrente (Lun-Dom) o gli ultimi 7 giorni fino alla fine del periodo
        LocalDate chartEnd = "week".equalsIgnoreCase(period) ? startDate.plusDays(6) : endDate;
        LocalDate chartStart = "week".equalsIgnoreCase(period) ? startDate : chartEnd.minusDays(6);

        // Una sola lettura dello storico copre periodo corrente, confronto e grafico (prima erano 9 query)
        LocalDate logsFrom = Collections.min(List.of(startDate, compStartDate, chartStart));
        LocalDate logsTo = Collections.max(List.of(endDate, compEndDate, chartEnd));
        Map<LocalDate, List<GvTransactionLog>> logsByDay = transactionLogRepository
                .findByTabacchinoIdAndRecordedAtBetweenAndDeletedFalseOrderByRecordedAtDesc(
                        tabacchinoId, logsFrom.atStartOfDay(), logsTo.atTime(LocalTime.MAX))
                .stream()
                .filter(t -> t.getRecordedAt() != null)
                .collect(Collectors.groupingBy(t -> t.getRecordedAt().toLocalDate()));

        // 1. Vendite nel periodo corrente (esclusi record soft-deleted)
        SalesTotals current = sumSales(logsByDay, startDate, endDate);
        int soldGv = current.tickets();
        BigDecimal totalRevenue = current.revenue();

        // Guadagno parziale: Aggio dell'8% su Gratta e Vinci venduti (normativa italiana monopolio)
        BigDecimal partialProfit = totalRevenue.multiply(BigDecimal.valueOf(0.08)).setScale(2, RoundingMode.HALF_UP);

        // 2. Vendite periodo di confronto (per calcolo trend vs ieri/periodo prec.)
        SalesTotals comparison = sumSales(logsByDay, compStartDate, compEndDate);
        int compSoldGv = comparison.tickets();
        BigDecimal compTotalRevenue = comparison.revenue();
        BigDecimal compPartialProfit = compTotalRevenue.multiply(BigDecimal.valueOf(0.08)).setScale(2, RoundingMode.HALF_UP);

        // Calcolo Trend Biglietti Venduti
        String soldGvTrend;
        String soldGvTrendDirection;
        if (soldGv > compSoldGv) {
            long diffPct = compSoldGv == 0 ? 100 : Math.round(((double) (soldGv - compSoldGv) / compSoldGv) * 100);
            soldGvTrend = "\u2191 +" + diffPct + "% " + compLabel;
            soldGvTrendDirection = "up";
        } else if (soldGv < compSoldGv) {
            long diffPct = Math.round(((double) (compSoldGv - soldGv) / compSoldGv) * 100);
            soldGvTrend = "\u2193 -" + diffPct + "% " + compLabel;
            soldGvTrendDirection = "down";
        } else {
            soldGvTrend = "Pari " + compLabel;
            soldGvTrendDirection = "neutral";
        }

        // Calcolo Trend Guadagno Parziale
        String partialProfitTrend;
        String partialProfitTrendDirection;
        if (partialProfit.compareTo(compPartialProfit) > 0) {
            long diffPct = compPartialProfit.compareTo(BigDecimal.ZERO) == 0 ? 100 :
                    Math.round(((partialProfit.subtract(compPartialProfit).doubleValue()) / compPartialProfit.doubleValue()) * 100);
            partialProfitTrend = "\u2191 +" + diffPct + "% " + compLabel;
            partialProfitTrendDirection = "up";
        } else if (partialProfit.compareTo(compPartialProfit) < 0) {
            long diffPct = compPartialProfit.compareTo(BigDecimal.ZERO) == 0 ? 0 :
                    Math.round(((compPartialProfit.subtract(partialProfit).doubleValue()) / compPartialProfit.doubleValue()) * 100);
            partialProfitTrend = "\u2193 -" + diffPct + "% " + compLabel;
            partialProfitTrendDirection = "down";
        } else {
            partialProfitTrend = "Pari " + compLabel;
            partialProfitTrendDirection = "neutral";
        }

        // 3. Vincite emesse nel periodo (esclusi record soft-deleted)
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);
        List<GvWinning> winnings = winningRepository.findByTabacchinoIdAndRecordedAtBetweenAndDeletedFalseOrderByRecordedAtDesc(
                tabacchinoId, startDateTime, endDateTime
        );
        BigDecimal winningsPaid = BigDecimal.ZERO;
        for (GvWinning w : winnings) {
            winningsPaid = winningsPaid.add(w.getAmount() != null ? w.getAmount() : BigDecimal.ZERO);
        }
        int winningsCount = winnings.size();
        String winningsTrend = winningsCount == 1 ? "1 operazione" : (winningsCount + " operazioni");

        // 4. Acquistati: Se il periodo selezionato è mensile ("month"), la fornitura passa su scala mensile;
        // per tutti gli altri periodi (oggi, ieri, settimana), la fornitura resta su base settimanale (Lun-Dom).
        LocalDate purchaseStart;
        LocalDate purchaseEnd;
        String purchasedSub;
        if ("month".equalsIgnoreCase(period)) {
            purchaseStart = today.withDayOfMonth(1);
            purchaseEnd = today.withDayOfMonth(today.lengthOfMonth());
            purchasedSub = "Fornitura mensile";
        } else {
            // Ciclo fornitura stecche: reset ogni domenica
            int dayOfWeek = today.getDayOfWeek().getValue(); // 1 = Lunedì, ..., 7 = Domenica
            purchaseStart = (dayOfWeek == 7) ? today : today.minusDays(dayOfWeek);
            purchaseEnd = purchaseStart.plusDays(6);
            purchasedSub = "Fornitura settimanale";
        }
        List<GvPurchase> purchases = purchaseRepository.findByTabacchinoIdAndPurchaseDateBetweenAndDeletedFalse(tabacchinoId, purchaseStart, purchaseEnd);
        BigDecimal purchasedAmount = BigDecimal.ZERO;
        for (GvPurchase p : purchases) {
            purchasedAmount = purchasedAmount.add(p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO);
        }

        // 5. Ultime Operazioni Reali dal DB
        List<GvTransactionLog> recentLogs = transactionLogRepository.findTop10ByTabacchinoIdAndDeletedFalseOrderByRecordedAtDesc(tabacchinoId);
        List<DashboardOperationDTO> recentOps = new ArrayList<>();
        for (GvTransactionLog log : recentLogs) {
            String text;
            if ("gv_add".equalsIgnoreCase(log.getType())) {
                text = "\u20AC" + (log.getPrice() != null ? log.getPrice().intValue() : "") + " \u00B7 +" + (log.getQuantity() != null ? log.getQuantity() : 1);
            } else if ("gv_sub".equalsIgnoreCase(log.getType())) {
                text = "Storno \u00B7 -" + (log.getQuantity() != null ? log.getQuantity() : 1) + " (da \u20AC" + (log.getPrice() != null ? log.getPrice().intValue() : "") + ")";
            } else if ("win".equalsIgnoreCase(log.getType())) {
                text = "Vincita \u00B7 \u20AC" + log.getAmount().setScale(2, RoundingMode.HALF_UP).toString().replace('.', ',');
            } else if ("closing".equalsIgnoreCase(log.getType())) {
                text = "Chiusura \u00B7 \u20AC" + log.getAmount().setScale(2, RoundingMode.HALF_UP).toString().replace('.', ',');
            } else {
                text = log.getLabel() != null ? log.getLabel() : "Operazione";
            }
            recentOps.add(new DashboardOperationDTO(
                    log.getId(),
                    log.getTimeRecorded(),
                    log.getType(),
                    text,
                    log.getAmount()
            ));
        }

        // 6. Punti del grafico per i 7 giorni
        List<DashboardChartPointDTO> chartPoints = new ArrayList<>();
        DateTimeFormatter dayMonthFmt = DateTimeFormatter.ofPattern("d MMM", Locale.ITALIAN);
        for (int i = 0; i < 7; i++) {
            LocalDate day = chartStart.plusDays(i);
            String dayLabel = day.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ITALIAN);
            dayLabel = dayLabel.substring(0, 1).toUpperCase() + dayLabel.substring(1);

            String dayFullName = day.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ITALIAN);
            dayFullName = dayFullName.substring(0, 1).toUpperCase() + dayFullName.substring(1);

            String formattedDate = day.format(dayMonthFmt);
            boolean isToday = day.equals(today);

            SalesTotals daySales = sumSales(logsByDay, day, day);
            int dayTickets = daySales.tickets();
            BigDecimal dayRevenue = daySales.revenue();
            BigDecimal dayProfit = dayRevenue.multiply(BigDecimal.valueOf(0.08)).setScale(2, RoundingMode.HALF_UP);

            chartPoints.add(new DashboardChartPointDTO(dayLabel, dayFullName, formattedDate, isToday, day, dayRevenue, dayTickets, dayProfit));
        }

        // Formattazione data odierna: "Mercoledì 9 settembre"
        DateTimeFormatter itDateFormatter = DateTimeFormatter.ofPattern("EEEE d MMMM", Locale.ITALIAN);
        String rawDateStr = today.format(itDateFormatter);
        String currentDateFormatted = rawDateStr.substring(0, 1).toUpperCase() + rawDateStr.substring(1);

        // Popolamento DTO finale
        DashboardStatsDTO dto = new DashboardStatsDTO();
        dto.setPeriod(period);
        dto.setPeriodLabel(periodLabel);
        dto.setCurrentDateFormatted(currentDateFormatted);
        dto.setSoldGv(soldGv);
        dto.setSoldGvTrend(soldGvTrend);
        dto.setSoldGvTrendDirection(soldGvTrendDirection);
        dto.setWinningsPaid(winningsPaid.setScale(2, RoundingMode.HALF_UP));
        dto.setWinningsCount(winningsCount);
        dto.setWinningsTrend(winningsTrend);
        dto.setPurchased(purchasedAmount.setScale(2, RoundingMode.HALF_UP));
        dto.setPurchasedSub(purchasedSub);
        dto.setPartialProfit(partialProfit);
        dto.setPartialProfitTrend(partialProfitTrend);
        dto.setPartialProfitTrendDirection(partialProfitTrendDirection);
        dto.setRecentOperations(recentOps);
        dto.setChartPoints(chartPoints);

        return dto;
    }

    private record SalesTotals(int tickets, BigDecimal revenue) {
    }

    /** Biglietti e incasso netti (vendite meno storni) tra due date incluse, mai negativi. */
    private static SalesTotals sumSales(Map<LocalDate, List<GvTransactionLog>> logsByDay, LocalDate from, LocalDate to) {
        int tickets = 0;
        BigDecimal revenue = BigDecimal.ZERO;
        for (LocalDate day = from; !day.isAfter(to); day = day.plusDays(1)) {
            for (GvTransactionLog transaction : logsByDay.getOrDefault(day, List.of())) {
                if (transaction.getPrice() == null) continue;
                int q = transaction.getQuantity() != null ? transaction.getQuantity() : 1;
                BigDecimal amount = transaction.getPrice().multiply(BigDecimal.valueOf(q));
                if ("gv_add".equalsIgnoreCase(transaction.getType())) {
                    tickets += q;
                    revenue = revenue.add(amount);
                } else if ("gv_sub".equalsIgnoreCase(transaction.getType())) {
                    tickets -= q;
                    revenue = revenue.subtract(amount);
                }
            }
        }
        return new SalesTotals(Math.max(0, tickets), revenue.max(BigDecimal.ZERO));
    }
}
