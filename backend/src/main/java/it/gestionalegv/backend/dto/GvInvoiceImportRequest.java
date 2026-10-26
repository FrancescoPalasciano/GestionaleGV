package it.gestionalegv.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Conferma del caricamento stecche da un dettaglio ordine Lottomatica già analizzato.
 */
public class GvInvoiceImportRequest {

    @Pattern(regexp = "^[0-9]{1,20}$", message = "Numero ordine non valido")
    private String orderNumber;

    private LocalDate purchaseDate;

    @Valid
    @NotEmpty(message = "La fattura non contiene stecche da caricare")
    private List<GvInvoiceLineDTO> lines = new ArrayList<>();

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public LocalDate getPurchaseDate() {
        return purchaseDate;
    }

    public void setPurchaseDate(LocalDate purchaseDate) {
        this.purchaseDate = purchaseDate;
    }

    public List<GvInvoiceLineDTO> getLines() {
        return lines;
    }

    public void setLines(List<GvInvoiceLineDTO> lines) {
        this.lines = lines;
    }
}
