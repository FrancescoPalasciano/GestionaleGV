package it.gestionalegv.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class DashboardChartPointDTO {

    private String dayLabel;        // "Lun", "Mar", "Mer", ...
    private String dayFullName;    // "Lunedì", "Martedì", ...
    private String formattedDate;   // "7 set", "8 set", ...
    private Boolean isToday;        // true se è oggi
    private LocalDate date;
    private BigDecimal revenue;
    private Integer tickets;
    private BigDecimal profit;

    public DashboardChartPointDTO() {
    }

    public DashboardChartPointDTO(String dayLabel,
                                  String dayFullName,
                                  String formattedDate,
                                  Boolean isToday,
                                  LocalDate date,
                                  BigDecimal revenue,
                                  Integer tickets,
                                  BigDecimal profit) {
        this.dayLabel = dayLabel;
        this.dayFullName = dayFullName;
        this.formattedDate = formattedDate;
        this.isToday = isToday;
        this.date = date;
        this.revenue = revenue;
        this.tickets = tickets;
        this.profit = profit;
    }

    public String getDayLabel() {
        return dayLabel;
    }

    public void setDayLabel(String dayLabel) {
        this.dayLabel = dayLabel;
    }

    public String getDayFullName() {
        return dayFullName;
    }

    public void setDayFullName(String dayFullName) {
        this.dayFullName = dayFullName;
    }

    public String getFormattedDate() {
        return formattedDate;
    }

    public void setFormattedDate(String formattedDate) {
        this.formattedDate = formattedDate;
    }

    public Boolean getIsToday() {
        return isToday;
    }

    public void setIsToday(Boolean isToday) {
        this.isToday = isToday;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public BigDecimal getRevenue() {
        return revenue;
    }

    public void setRevenue(BigDecimal revenue) {
        this.revenue = revenue;
    }

    public Integer getTickets() {
        return tickets;
    }

    public void setTickets(Integer tickets) {
        this.tickets = tickets;
    }

    public BigDecimal getProfit() {
        return profit;
    }

    public void setProfit(BigDecimal profit) {
        this.profit = profit;
    }
}
