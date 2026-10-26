package it.gestionalegv.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Anteprima del dettaglio ordine Lottomatica letto dal PDF, mostrata prima di caricare le stecche.
 */
public class GvInvoicePreviewDTO {

    private String orderNumber;
    private LocalDate orderDate;
    private List<GvInvoiceLineDTO> lines = new ArrayList<>();
    private Integer totalPacks;
    private Integer totalTickets;
    private BigDecimal totalAmount;
    private boolean alreadyImported;
    private List<String> warnings = new ArrayList<>();

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public LocalDate getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(LocalDate orderDate) {
        this.orderDate = orderDate;
    }

    public List<GvInvoiceLineDTO> getLines() {
        return lines;
    }

    public void setLines(List<GvInvoiceLineDTO> lines) {
        this.lines = lines;
    }

    public Integer getTotalPacks() {
        return totalPacks;
    }

    public void setTotalPacks(Integer totalPacks) {
        this.totalPacks = totalPacks;
    }

    public Integer getTotalTickets() {
        return totalTickets;
    }

    public void setTotalTickets(Integer totalTickets) {
        this.totalTickets = totalTickets;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public boolean isAlreadyImported() {
        return alreadyImported;
    }

    public void setAlreadyImported(boolean alreadyImported) {
        this.alreadyImported = alreadyImported;
    }

    public List<String> getWarnings() {
        return warnings;
    }

    public void setWarnings(List<String> warnings) {
        this.warnings = warnings;
    }
}
