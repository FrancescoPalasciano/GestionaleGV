package it.gestionalegv.backend.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class GvStatisticsDTO {

    private String period; // "day" | "week" | "month" | "year"
    private String periodLabel; // es. "Mercoledì 9 Settembre 2026", "Settembre 2026", "Anno 2026"
    private String referenceDate; // "2026-09-09"

    // ── Indicatori Chiave (KPI) ──────────────────────────────────────────────
    private BigDecimal totalRevenue = BigDecimal.ZERO;
    private Integer totalTickets = 0;
    private BigDecimal totalAggio = BigDecimal.ZERO;
    private BigDecimal totalWinnings = BigDecimal.ZERO;
    private Integer winningsCount = 0;
    private BigDecimal netCashFlow = BigDecimal.ZERO;
    private BigDecimal totalPurchases = BigDecimal.ZERO;
    private Integer totalStecche = 0;
    private Integer totalSteccheTickets = 0;
    private BigDecimal averageTicketPrice = BigDecimal.ZERO;
    private BigDecimal payoutRate = BigDecimal.ZERO; // % vincite su incasso

    // ── Dettaglio Vincite ────────────────────────────────────────────────────
    private BigDecimal singleWinningsAmount = BigDecimal.ZERO;
    private Integer singleWinningsCount = 0;
    private BigDecimal closingWinningsAmount = BigDecimal.ZERO;
    private Integer closingWinningsCount = 0;

    // ── Punti Grafico Serie Temporale ────────────────────────────────────────
    private List<ChartPoint> chartPoints = new ArrayList<>();

    // ── Ripartizione per Fascia di Prezzo ────────────────────────────────────
    private List<TierStat> tierStats = new ArrayList<>();

    // ── Ripartizione Forniture per Fascia ────────────────────────────────────
    private List<PurchaseTierStat> purchaseTierStats = new ArrayList<>();

    public GvStatisticsDTO() {
    }

    // ── Classi Interne DTO ───────────────────────────────────────────────────

    public static class ChartPoint {
        private String label; // "08:00", "01/09", "Gen"
        private String fullLabel; // "Fascia 08:00 - 10:00", "01 Settembre", ecc.
        private BigDecimal revenue = BigDecimal.ZERO;
        private BigDecimal aggio = BigDecimal.ZERO;
        private BigDecimal winnings = BigDecimal.ZERO;
        private Integer tickets = 0;

        public ChartPoint() {
        }

        public ChartPoint(String label, String fullLabel, BigDecimal revenue, BigDecimal aggio, BigDecimal winnings, Integer tickets) {
            this.label = label;
            this.fullLabel = fullLabel;
            this.revenue = revenue != null ? revenue : BigDecimal.ZERO;
            this.aggio = aggio != null ? aggio : BigDecimal.ZERO;
            this.winnings = winnings != null ? winnings : BigDecimal.ZERO;
            this.tickets = tickets != null ? tickets : 0;
        }

        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }

        public String getFullLabel() { return fullLabel; }
        public void setFullLabel(String fullLabel) { this.fullLabel = fullLabel; }

        public BigDecimal getRevenue() { return revenue; }
        public void setRevenue(BigDecimal revenue) { this.revenue = revenue; }

        public BigDecimal getAggio() { return aggio; }
        public void setAggio(BigDecimal aggio) { this.aggio = aggio; }

        public BigDecimal getWinnings() { return winnings; }
        public void setWinnings(BigDecimal winnings) { this.winnings = winnings; }

        public Integer getTickets() { return tickets; }
        public void setTickets(Integer tickets) { this.tickets = tickets; }
    }

    public static class TierStat {
        private BigDecimal price;
        private Integer ticketsSold = 0;
        private BigDecimal revenue = BigDecimal.ZERO;
        private BigDecimal aggio = BigDecimal.ZERO;
        private BigDecimal percentageShare = BigDecimal.ZERO;

        public TierStat() {
        }

        public TierStat(BigDecimal price, Integer ticketsSold, BigDecimal revenue, BigDecimal aggio, BigDecimal percentageShare) {
            this.price = price;
            this.ticketsSold = ticketsSold != null ? ticketsSold : 0;
            this.revenue = revenue != null ? revenue : BigDecimal.ZERO;
            this.aggio = aggio != null ? aggio : BigDecimal.ZERO;
            this.percentageShare = percentageShare != null ? percentageShare : BigDecimal.ZERO;
        }

        public BigDecimal getPrice() { return price; }
        public void setPrice(BigDecimal price) { this.price = price; }

        public Integer getTicketsSold() { return ticketsSold; }
        public void setTicketsSold(Integer ticketsSold) { this.ticketsSold = ticketsSold; }

        public BigDecimal getRevenue() { return revenue; }
        public void setRevenue(BigDecimal revenue) { this.revenue = revenue; }

        public BigDecimal getAggio() { return aggio; }
        public void setAggio(BigDecimal aggio) { this.aggio = aggio; }

        public BigDecimal getPercentageShare() { return percentageShare; }
        public void setPercentageShare(BigDecimal percentageShare) { this.percentageShare = percentageShare; }
    }

    public static class PurchaseTierStat {
        private BigDecimal price;
        private Integer steccheCount = 0;
        private Integer ticketsCount = 0;
        private BigDecimal amount = BigDecimal.ZERO;

        public PurchaseTierStat() {
        }

        public PurchaseTierStat(BigDecimal price, Integer steccheCount, Integer ticketsCount, BigDecimal amount) {
            this.price = price;
            this.steccheCount = steccheCount != null ? steccheCount : 0;
            this.ticketsCount = ticketsCount != null ? ticketsCount : 0;
            this.amount = amount != null ? amount : BigDecimal.ZERO;
        }

        public BigDecimal getPrice() { return price; }
        public void setPrice(BigDecimal price) { this.price = price; }

        public Integer getSteccheCount() { return steccheCount; }
        public void setSteccheCount(Integer steccheCount) { this.steccheCount = steccheCount; }

        public Integer getTicketsCount() { return ticketsCount; }
        public void setTicketsCount(Integer ticketsCount) { this.ticketsCount = ticketsCount; }

        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
    }

    // ── Getters & Setters Principali ─────────────────────────────────────────

    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }

    public String getPeriodLabel() { return periodLabel; }
    public void setPeriodLabel(String periodLabel) { this.periodLabel = periodLabel; }

    public String getReferenceDate() { return referenceDate; }
    public void setReferenceDate(String referenceDate) { this.referenceDate = referenceDate; }

    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }

    public Integer getTotalTickets() { return totalTickets; }
    public void setTotalTickets(Integer totalTickets) { this.totalTickets = totalTickets; }

    public BigDecimal getTotalAggio() { return totalAggio; }
    public void setTotalAggio(BigDecimal totalAggio) { this.totalAggio = totalAggio; }

    public BigDecimal getTotalWinnings() { return totalWinnings; }
    public void setTotalWinnings(BigDecimal totalWinnings) { this.totalWinnings = totalWinnings; }

    public Integer getWinningsCount() { return winningsCount; }
    public void setWinningsCount(Integer winningsCount) { this.winningsCount = winningsCount; }

    public BigDecimal getNetCashFlow() { return netCashFlow; }
    public void setNetCashFlow(BigDecimal netCashFlow) { this.netCashFlow = netCashFlow; }

    public BigDecimal getTotalPurchases() { return totalPurchases; }
    public void setTotalPurchases(BigDecimal totalPurchases) { this.totalPurchases = totalPurchases; }

    public Integer getTotalStecche() { return totalStecche; }
    public void setTotalStecche(Integer totalStecche) { this.totalStecche = totalStecche; }

    public Integer getTotalSteccheTickets() { return totalSteccheTickets; }
    public void setTotalSteccheTickets(Integer totalSteccheTickets) { this.totalSteccheTickets = totalSteccheTickets; }

    public BigDecimal getAverageTicketPrice() { return averageTicketPrice; }
    public void setAverageTicketPrice(BigDecimal averageTicketPrice) { this.averageTicketPrice = averageTicketPrice; }

    public BigDecimal getPayoutRate() { return payoutRate; }
    public void setPayoutRate(BigDecimal payoutRate) { this.payoutRate = payoutRate; }

    public BigDecimal getSingleWinningsAmount() { return singleWinningsAmount; }
    public void setSingleWinningsAmount(BigDecimal singleWinningsAmount) { this.singleWinningsAmount = singleWinningsAmount; }

    public Integer getSingleWinningsCount() { return singleWinningsCount; }
    public void setSingleWinningsCount(Integer singleWinningsCount) { this.singleWinningsCount = singleWinningsCount; }

    public BigDecimal getClosingWinningsAmount() { return closingWinningsAmount; }
    public void setClosingWinningsAmount(BigDecimal closingWinningsAmount) { this.closingWinningsAmount = closingWinningsAmount; }

    public Integer getClosingWinningsCount() { return closingWinningsCount; }
    public void setClosingWinningsCount(Integer closingWinningsCount) { this.closingWinningsCount = closingWinningsCount; }

    public List<ChartPoint> getChartPoints() { return chartPoints; }
    public void setChartPoints(List<ChartPoint> chartPoints) { this.chartPoints = chartPoints; }

    public List<TierStat> getTierStats() { return tierStats; }
    public void setTierStats(List<TierStat> tierStats) { this.tierStats = tierStats; }

    public List<PurchaseTierStat> getPurchaseTierStats() { return purchaseTierStats; }
    public void setPurchaseTierStats(List<PurchaseTierStat> purchaseTierStats) { this.purchaseTierStats = purchaseTierStats; }
}
