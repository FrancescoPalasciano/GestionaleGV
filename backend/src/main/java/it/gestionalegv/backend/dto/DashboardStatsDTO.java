package it.gestionalegv.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public class DashboardStatsDTO {

    private String period;
    private String periodLabel;
    private String currentDateFormatted;

    // Card 1: Gratta e Vinci Venduti
    private Integer soldGv;
    private String soldGvTrend;
    private String soldGvTrendDirection; // "up", "down", "neutral"

    // Card 2: Vincite Emesse
    private BigDecimal winningsPaid;
    private Integer winningsCount;
    private String winningsTrend;

    // Card 3: Acquistati
    private BigDecimal purchased;
    private String purchasedSub;

    // Card 4: Guadagno Parziale
    private BigDecimal partialProfit;
    private String partialProfitTrend;
    private String partialProfitTrendDirection; // "up", "down", "neutral"

    // Ultime operazioni
    private List<DashboardOperationDTO> recentOperations;

    // Punti grafico andamento economico
    private List<DashboardChartPointDTO> chartPoints;

    public DashboardStatsDTO() {
    }

    // --- Getters & Setters ---

    public String getPeriod() {
        return period;
    }

    public void setPeriod(String period) {
        this.period = period;
    }

    public String getPeriodLabel() {
        return periodLabel;
    }

    public void setPeriodLabel(String periodLabel) {
        this.periodLabel = periodLabel;
    }

    public String getCurrentDateFormatted() {
        return currentDateFormatted;
    }

    public void setCurrentDateFormatted(String currentDateFormatted) {
        this.currentDateFormatted = currentDateFormatted;
    }

    public Integer getSoldGv() {
        return soldGv;
    }

    public void setSoldGv(Integer soldGv) {
        this.soldGv = soldGv;
    }

    public String getSoldGvTrend() {
        return soldGvTrend;
    }

    public void setSoldGvTrend(String soldGvTrend) {
        this.soldGvTrend = soldGvTrend;
    }

    public String getSoldGvTrendDirection() {
        return soldGvTrendDirection;
    }

    public void setSoldGvTrendDirection(String soldGvTrendDirection) {
        this.soldGvTrendDirection = soldGvTrendDirection;
    }

    public BigDecimal getWinningsPaid() {
        return winningsPaid;
    }

    public void setWinningsPaid(BigDecimal winningsPaid) {
        this.winningsPaid = winningsPaid;
    }

    public Integer getWinningsCount() {
        return winningsCount;
    }

    public void setWinningsCount(Integer winningsCount) {
        this.winningsCount = winningsCount;
    }

    public String getWinningsTrend() {
        return winningsTrend;
    }

    public void setWinningsTrend(String winningsTrend) {
        this.winningsTrend = winningsTrend;
    }

    public BigDecimal getPurchased() {
        return purchased;
    }

    public void setPurchased(BigDecimal purchased) {
        this.purchased = purchased;
    }

    public String getPurchasedSub() {
        return purchasedSub;
    }

    public void setPurchasedSub(String purchasedSub) {
        this.purchasedSub = purchasedSub;
    }

    public BigDecimal getPartialProfit() {
        return partialProfit;
    }

    public void setPartialProfit(BigDecimal partialProfit) {
        this.partialProfit = partialProfit;
    }

    public String getPartialProfitTrend() {
        return partialProfitTrend;
    }

    public void setPartialProfitTrend(String partialProfitTrend) {
        this.partialProfitTrend = partialProfitTrend;
    }

    public String getPartialProfitTrendDirection() {
        return partialProfitTrendDirection;
    }

    public void setPartialProfitTrendDirection(String partialProfitTrendDirection) {
        this.partialProfitTrendDirection = partialProfitTrendDirection;
    }

    public List<DashboardOperationDTO> getRecentOperations() {
        return recentOperations;
    }

    public void setRecentOperations(List<DashboardOperationDTO> recentOperations) {
        this.recentOperations = recentOperations;
    }

    public List<DashboardChartPointDTO> getChartPoints() {
        return chartPoints;
    }

    public void setChartPoints(List<DashboardChartPointDTO> chartPoints) {
        this.chartPoints = chartPoints;
    }
}
