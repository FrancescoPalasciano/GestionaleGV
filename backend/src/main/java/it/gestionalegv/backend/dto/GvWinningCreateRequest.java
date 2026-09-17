package it.gestionalegv.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public class GvWinningCreateRequest {

    @NotNull(message = "L'importo della vincita è obbligatorio")
    @DecimalMin(value = "0.01", message = "L'importo deve essere maggiore di zero")
    private BigDecimal amount;

    @Size(max = 100, message = "La fascia può contenere al massimo 100 caratteri")
    private String tier;

    @Pattern(regexp = "single|closing", message = "Tipo vincita non valido")
    private String type = "single"; // "single" | "closing"

    @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Orario non valido")
    private String timeRecorded;

    @Pattern(regexp = "append|replace", message = "Modalità di salvataggio non valida")
    private String mode = "append"; // "replace" | "append" (usato per chiusure serali)

    @Size(max = 500, message = "La nota può contenere al massimo 500 caratteri")
    private String note;

    public GvWinningCreateRequest() {
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getTier() {
        return tier;
    }

    public void setTier(String tier) {
        this.tier = tier;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTimeRecorded() {
        return timeRecorded;
    }

    public void setTimeRecorded(String timeRecorded) {
        this.timeRecorded = timeRecorded;
    }

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
