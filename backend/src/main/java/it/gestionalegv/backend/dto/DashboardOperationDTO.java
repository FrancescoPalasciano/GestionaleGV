package it.gestionalegv.backend.dto;

import java.math.BigDecimal;

public class DashboardOperationDTO {

    private Long id;
    private String time;
    private String type;
    private String text;
    private BigDecimal amount;

    public DashboardOperationDTO() {
    }

    public DashboardOperationDTO(Long id, String time, String type, String text, BigDecimal amount) {
        this.id = id;
        this.time = time;
        this.type = type;
        this.text = text;
        this.amount = amount;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
}
