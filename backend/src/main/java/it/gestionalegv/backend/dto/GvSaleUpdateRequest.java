package it.gestionalegv.backend.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class GvSaleUpdateRequest {

    @NotNull(message = "Il prezzo è obbligatorio")
    private BigDecimal price;

    @NotNull(message = "Il delta quantità è obbligatorio")
    private Integer delta;

    public GvSaleUpdateRequest() {
    }

    public GvSaleUpdateRequest(BigDecimal price, Integer delta) {
        this.price = price;
        this.delta = delta;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getDelta() {
        return delta;
    }

    public void setDelta(Integer delta) {
        this.delta = delta;
    }
}
