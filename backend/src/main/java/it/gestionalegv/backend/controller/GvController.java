package it.gestionalegv.backend.controller;

import it.gestionalegv.backend.dto.*;
import it.gestionalegv.backend.security.SecurityUtils;
import it.gestionalegv.backend.service.GvService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.format.annotation.DateTimeFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Controller REST per tutte le operazioni relative ai Gratta e Vinci.
 * Tutti gli endpoint richiedono autenticazione JWT e agiscono sul Tabacchino dell'utente loggato.
 */
@RestController
@RequestMapping("/api/v1/gv")
public class GvController {

    private final GvService gvService;
    private final SecurityUtils securityUtils;

    public GvController(GvService gvService, SecurityUtils securityUtils) {
        this.gvService = gvService;
        this.securityUtils = securityUtils;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Fasce di Prezzo
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/price-tiers")
    public ResponseEntity<List<GvPriceTierDTO>> getPriceTiers() {
        Long tabacchinoId = securityUtils.getCurrentTabacchinoId();
        return ResponseEntity.ok(gvService.getPriceTiers(tabacchinoId));
    }

    @PostMapping("/price-tiers")
    public ResponseEntity<GvPriceTierDTO> addPriceTier(@Valid @RequestBody GvPriceTierCreateRequest request) {
        Long tabacchinoId = securityUtils.getCurrentTabacchinoId();
        GvPriceTierDTO created = gvService.addPriceTier(tabacchinoId, request.getPrice());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/price-tiers/{price}")
    public ResponseEntity<Map<String, String>> deletePriceTier(@PathVariable BigDecimal price) {
        Long tabacchinoId = securityUtils.getCurrentTabacchinoId();
        gvService.deletePriceTier(tabacchinoId, price);
        return ResponseEntity.ok(Map.of("message", "Fascia di prezzo eliminata con successo"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Vendite Odierne
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/sales/today")
    public ResponseEntity<List<GvSaleDTO>> getSalesToday() {
        Long tabacchinoId = securityUtils.getCurrentTabacchinoId();
        return ResponseEntity.ok(gvService.getSalesToday(tabacchinoId));
    }

    @PostMapping("/sales")
    public ResponseEntity<GvSaleDTO> updateSale(@Valid @RequestBody GvSaleUpdateRequest request) {
        Long tabacchinoId = securityUtils.getCurrentTabacchinoId();
        GvSaleDTO updated = gvService.updateSale(tabacchinoId, request.getPrice(), request.getDelta());
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/sales/reset")
    public ResponseEntity<Map<String, String>> resetSalesToday() {
        Long tabacchinoId = securityUtils.getCurrentTabacchinoId();
        gvService.resetSalesToday(tabacchinoId);
        return ResponseEntity.ok(Map.of("message", "Vendite odierne azzerate con successo"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Vincite Odierne
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/winnings/today")
    public ResponseEntity<List<GvWinningDTO>> getWinningsToday() {
        Long tabacchinoId = securityUtils.getCurrentTabacchinoId();
        return ResponseEntity.ok(gvService.getWinningsToday(tabacchinoId));
    }

    @PostMapping("/winnings")
    public ResponseEntity<GvWinningDTO> addWinning(@Valid @RequestBody GvWinningCreateRequest request) {
        Long tabacchinoId = securityUtils.getCurrentTabacchinoId();
        GvWinningDTO created = gvService.addWinning(tabacchinoId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/winnings/{id}")
    public ResponseEntity<Map<String, String>> deleteWinning(@PathVariable Long id) {
        Long tabacchinoId = securityUtils.getCurrentTabacchinoId();
        gvService.deleteWinning(tabacchinoId, id);
        return ResponseEntity.ok(Map.of("message", "Vincita eliminata con successo"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Storico Transazioni
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/transactions/today")
    public ResponseEntity<List<GvTransactionLogDTO>> getTransactionsToday() {
        Long tabacchinoId = securityUtils.getCurrentTabacchinoId();
        return ResponseEntity.ok(gvService.getTransactionsToday(tabacchinoId));
    }

    @PostMapping("/transactions")
    public ResponseEntity<GvTransactionLogDTO> logTransaction(@Valid @RequestBody GvTransactionLogCreateRequest request) {
        Long tabacchinoId = securityUtils.getCurrentTabacchinoId();
        GvTransactionLogDTO created = gvService.logTransaction(tabacchinoId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/transactions/{id}")
    public ResponseEntity<Map<String, String>> deleteTransaction(@PathVariable Long id) {
        Long tabacchinoId = securityUtils.getCurrentTabacchinoId();
        gvService.deleteTransaction(tabacchinoId, id);
        return ResponseEntity.ok(Map.of("message", "Transazione eliminata con successo"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Acquisti / Forniture Settimanali
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/purchases")
    public ResponseEntity<List<GvPurchaseDTO>> getPurchases(@RequestParam(required = false) String period) {
        Long tabacchinoId = securityUtils.getCurrentTabacchinoId();
        return ResponseEntity.ok(gvService.getPurchases(tabacchinoId, period));
    }

    @PostMapping("/purchases")
    public ResponseEntity<GvPurchaseDTO> addPurchase(@Valid @RequestBody GvPurchaseCreateRequest request) {
        Long tabacchinoId = securityUtils.getCurrentTabacchinoId();
        GvPurchaseDTO created = gvService.addPurchase(tabacchinoId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/purchases/stecca")
    public ResponseEntity<?> updateStecca(@RequestBody Map<String, Object> payload) {
        Long tabacchinoId = securityUtils.getCurrentTabacchinoId();
        BigDecimal price = new BigDecimal(payload.get("price").toString());
        int delta = Integer.parseInt(payload.get("delta").toString());
        GvPurchaseDTO result = gvService.addSteccaPurchase(tabacchinoId, price, delta);
        return ResponseEntity.ok(result != null ? result : Map.of("status", "updated"));
    }

    @DeleteMapping("/purchases/{id}")
    public ResponseEntity<Map<String, String>> deletePurchase(@PathVariable Long id) {
        Long tabacchinoId = securityUtils.getCurrentTabacchinoId();
        gvService.deletePurchase(tabacchinoId, id);
        return ResponseEntity.ok(Map.of("message", "Acquisto eliminato con successo"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Statistiche Avanzate Gratta e Vinci
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/statistics")
    public ResponseEntity<GvStatisticsDTO> getStatistics(
            @RequestParam(required = false, defaultValue = "day") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        Long tabacchinoId = securityUtils.getCurrentTabacchinoId();
        return ResponseEntity.ok(gvService.getStatistics(tabacchinoId, period, date));
    }
}
