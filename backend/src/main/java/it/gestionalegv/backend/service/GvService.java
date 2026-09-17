package it.gestionalegv.backend.service;

import it.gestionalegv.backend.dto.*;
import it.gestionalegv.backend.model.*;
import it.gestionalegv.backend.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class GvService {

    private static final Logger log = LoggerFactory.getLogger(GvService.class);
    private static final List<BigDecimal> DEFAULT_PRICE_TIERS = Arrays.asList(
            BigDecimal.valueOf(1),
            BigDecimal.valueOf(2),
            BigDecimal.valueOf(5),
            BigDecimal.valueOf(10),
            BigDecimal.valueOf(20),
            BigDecimal.valueOf(25)
    );

    private final GvPriceTierRepository priceTierRepository;
    private final GvSaleRepository saleRepository;
    private final GvWinningRepository winningRepository;
    private final GvTransactionLogRepository transactionLogRepository;
    private final GvPurchaseRepository purchaseRepository;
    private final TabacchinoRepository tabacchinoRepository;

    public GvService(GvPriceTierRepository priceTierRepository,
                     GvSaleRepository saleRepository,
                     GvWinningRepository winningRepository,
                     GvTransactionLogRepository transactionLogRepository,
                     GvPurchaseRepository purchaseRepository,
                     TabacchinoRepository tabacchinoRepository) {
        this.priceTierRepository = priceTierRepository;
        this.saleRepository = saleRepository;
        this.winningRepository = winningRepository;
        this.transactionLogRepository = transactionLogRepository;
        this.purchaseRepository = purchaseRepository;
        this.tabacchinoRepository = tabacchinoRepository;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. FASCE DI PREZZO (Price Tiers)
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<GvPriceTierDTO> getPriceTiers(Long tabacchinoId) {
        List<GvPriceTier> tiers = priceTierRepository.findByTabacchinoIdOrderByPriceAsc(tabacchinoId);
        return tiers.stream().map(this::toPriceTierDTO).collect(Collectors.toList());
    }

    public GvPriceTierDTO addPriceTier(Long tabacchinoId, BigDecimal price) {
        if (priceTierRepository.existsByTabacchinoIdAndPrice(tabacchinoId, price)) {
            throw new IllegalArgumentException("La fascia di prezzo \u20AC " + price + " esiste gi\u00E0");
        }
        Tabacchino tabacchino = getTabacchino(tabacchinoId);
        GvPriceTier tier = new GvPriceTier(tabacchino, price);
        GvPriceTier saved = priceTierRepository.save(tier);
        return toPriceTierDTO(saved);
    }

    public void deletePriceTier(Long tabacchinoId, BigDecimal price) {
        priceTierRepository.deleteByTabacchinoIdAndPrice(tabacchinoId, price);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. VENDITE ODRIERNE (Sales)
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<GvSaleDTO> getSalesToday(Long tabacchinoId) {
        LocalDate today = LocalDate.now();
        return saleRepository.findByTabacchinoIdAndSaleDateAndDeletedFalse(tabacchinoId, today)
                .stream().map(this::toSaleDTO).collect(Collectors.toList());
    }

    public GvSaleDTO updateSale(Long tabacchinoId, BigDecimal price, Integer delta) {
        LocalDate today = LocalDate.now();
        Tabacchino tabacchino = getTabacchino(tabacchinoId);
        BigDecimal normalizedPrice = price.setScale(2, RoundingMode.HALF_UP);

        Optional<GvSale> existingSaleOpt = saleRepository.findByTabacchinoIdAndPriceAndSaleDate(tabacchinoId, normalizedPrice, today);

        GvSale sale;
        if (existingSaleOpt.isPresent()) {
            sale = existingSaleOpt.get();
            int baseQuantity = Boolean.TRUE.equals(sale.getDeleted()) ? 0 : (sale.getQuantity() != null ? sale.getQuantity() : 0);
            int newQuantity = Math.max(0, baseQuantity + delta);
            sale.setQuantity(newQuantity);
            sale.setDeleted(false);
            sale.setDeletedAt(null);
            sale.setUpdatedAt(LocalDateTime.now());
        } else {
            int newQuantity = Math.max(0, delta);
            sale = new GvSale(tabacchino, normalizedPrice, newQuantity, today);
            sale.setDeleted(false);
            sale.setDeletedAt(null);
            sale.setUpdatedAt(LocalDateTime.now());
        }

        GvSale saved = saleRepository.save(sale);
        return toSaleDTO(saved);
    }

    /** Aggiorna il contatore e registra lo storico nella stessa transazione DB. */
    public GvSaleDTO updateSaleAndLog(Long tabacchinoId, GvSaleTransactionRequest request) {
        BigDecimal price = request.getPrice().setScale(2, RoundingMode.HALF_UP);
        LocalDate today = LocalDate.now();
        int previousQuantity = saleRepository
                .findByTabacchinoIdAndPriceAndSaleDate(tabacchinoId, price, today)
                .filter(s -> !Boolean.TRUE.equals(s.getDeleted()))
                .map(GvSale::getQuantity)
                .orElse(0);

        GvSaleDTO updated = updateSale(tabacchinoId, price, request.getDelta());
        int appliedDelta = updated.getQuantity() - previousQuantity;
        if (appliedDelta != 0) {
            int quantity = Math.abs(appliedDelta);
            GvTransactionLogCreateRequest logRequest = new GvTransactionLogCreateRequest();
            logRequest.setType(appliedDelta > 0 ? "gv_add" : "gv_sub");
            logRequest.setPrice(price);
            logRequest.setQuantity(quantity);
            logRequest.setAmount(price.multiply(BigDecimal.valueOf(quantity)));
            logRequest.setLabel(appliedDelta > 0
                    ? "+" + quantity + " bigliett" + (quantity == 1 ? "o" : "i") + " da € " + price
                    : "−" + quantity + " storn" + (quantity == 1 ? "o" : "i") + " da € " + price);
            logRequest.setTimeRecorded(request.getTimeRecorded());
            logTransaction(tabacchinoId, logRequest);
        }
        return updated;
    }

    public void resetSalesToday(Long tabacchinoId) {
        LocalDate today = LocalDate.now();
        List<GvSale> activeSales = saleRepository.findByTabacchinoIdAndSaleDateAndDeletedFalse(tabacchinoId, today);
        LocalDateTime now = LocalDateTime.now();
        for (GvSale s : activeSales) {
            s.setDeleted(true);
            s.setDeletedAt(now);
        }
        saleRepository.saveAll(activeSales);
        log.info("Soft-delete eseguito su {} record di vendita odierni per tabacchino {}", activeSales.size(), tabacchinoId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. VINCITE (Winnings)
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<GvWinningDTO> getWinningsToday(Long tabacchinoId) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);
        return winningRepository.findByTabacchinoIdAndRecordedAtBetweenAndDeletedFalseOrderByRecordedAtDesc(
                tabacchinoId, startOfDay, endOfDay
        ).stream().map(this::toWinningDTO).collect(Collectors.toList());
    }

    public GvWinningDTO addWinning(Long tabacchinoId, GvWinningCreateRequest request) {
        Tabacchino tabacchino = getTabacchino(tabacchinoId);
        LocalDateTime now = LocalDateTime.now();

        // Se è una chiusura serale con modalità "replace", ripulisci (soft-delete) le vincite odierne
        if ("closing".equalsIgnoreCase(request.getType()) && "replace".equalsIgnoreCase(request.getMode())) {
            LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
            LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);
            List<GvWinning> todayWins = winningRepository.findByTabacchinoIdAndRecordedAtBetweenAndDeletedFalseOrderByRecordedAtDesc(
                    tabacchinoId, startOfDay, endOfDay
            );
            for (GvWinning w : todayWins) {
                w.setDeleted(true);
                w.setDeletedAt(now);
            }
            winningRepository.saveAll(todayWins);

            List<GvTransactionLog> todayLogs = transactionLogRepository
                    .findByTabacchinoIdAndRecordedAtBetweenAndDeletedFalseOrderByRecordedAtDesc(
                            tabacchinoId, startOfDay, endOfDay);
            for (GvTransactionLog transaction : todayLogs) {
                if ("win".equalsIgnoreCase(transaction.getType()) || "closing".equalsIgnoreCase(transaction.getType())) {
                    transaction.setDeleted(true);
                    transaction.setDeletedAt(now);
                }
            }
            transactionLogRepository.saveAll(todayLogs);
        }

        String timeRecorded = request.getTimeRecorded();
        if (timeRecorded == null || timeRecorded.isBlank()) {
            timeRecorded = now.format(DateTimeFormatter.ofPattern("HH:mm"));
        }

        GvWinning winning = new GvWinning(
                tabacchino,
                request.getAmount(),
                request.getTier(),
                request.getType() != null ? request.getType() : "single",
                timeRecorded,
                now,
                request.getNote()
        );

        GvWinning saved = winningRepository.save(winning);
        return toWinningDTO(saved);
    }

    /** Registra vincita e relativo movimento di storico in modo atomico. */
    public GvWinningDTO addWinningWithLog(Long tabacchinoId, GvWinningCreateRequest request) {
        GvWinningDTO winning = addWinning(tabacchinoId, request);
        boolean closing = "closing".equalsIgnoreCase(request.getType());

        GvTransactionLogCreateRequest logRequest = new GvTransactionLogCreateRequest();
        logRequest.setType(closing ? "closing" : "win");
        logRequest.setAmount(request.getAmount());
        logRequest.setTier(request.getTier());
        logRequest.setLabel(closing ? "Chiusura serale terminale" : "Vincita · Biglietto " + request.getTier());
        logRequest.setTimeRecorded(winning.getTimeRecorded());
        logRequest.setRelatedEntityId(winning.getId());
        logTransaction(tabacchinoId, logRequest);
        return winning;
    }

    public void deleteWinning(Long tabacchinoId, Long id) {
        winningRepository.findById(id).ifPresent(w -> {
            if (w.getTabacchino().getId().equals(tabacchinoId)) {
                w.setDeleted(true);
                w.setDeletedAt(LocalDateTime.now());
                winningRepository.save(w);
            }
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. STORICO TRANSAZIONI (Transaction Log)
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<GvTransactionLogDTO> getTransactionsToday(Long tabacchinoId) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);
        return transactionLogRepository.findByTabacchinoIdAndRecordedAtBetweenAndDeletedFalseOrderByRecordedAtDesc(
                tabacchinoId, startOfDay, endOfDay
        ).stream().map(this::toTransactionLogDTO).collect(Collectors.toList());
    }

    public GvTransactionLogDTO logTransaction(Long tabacchinoId, GvTransactionLogCreateRequest request) {
        Tabacchino tabacchino = getTabacchino(tabacchinoId);
        LocalDateTime now = LocalDateTime.now();

        String timeRecorded = request.getTimeRecorded();
        if (timeRecorded == null || timeRecorded.isBlank()) {
            timeRecorded = now.format(DateTimeFormatter.ofPattern("HH:mm"));
        }

        GvTransactionLog logEntry = new GvTransactionLog(
                tabacchino,
                request.getType(),
                request.getPrice(),
                request.getQuantity(),
                request.getAmount(),
                request.getTier(),
                request.getLabel(),
                timeRecorded,
                now
        );
        logEntry.setRelatedEntityId(request.getRelatedEntityId());

        GvTransactionLog saved = transactionLogRepository.save(logEntry);
        return toTransactionLogDTO(saved);
    }

    public void deleteTransaction(Long tabacchinoId, Long id) {
        GvTransactionLog transaction = transactionLogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Transazione non trovata"));
        if (!transaction.getTabacchino().getId().equals(tabacchinoId)) {
            throw new IllegalArgumentException("Transazione non trovata");
        }

        if (transaction.getRelatedEntityId() != null
                && ("win".equalsIgnoreCase(transaction.getType())
                || "closing".equalsIgnoreCase(transaction.getType()))) {
            deleteWinning(tabacchinoId, transaction.getRelatedEntityId());
        }

        if (transaction.getPrice() != null && transaction.getQuantity() != null) {
            if ("gv_add".equalsIgnoreCase(transaction.getType())) {
                updateSale(tabacchinoId, transaction.getPrice(), -transaction.getQuantity());
            } else if ("gv_sub".equalsIgnoreCase(transaction.getType())) {
                updateSale(tabacchinoId, transaction.getPrice(), transaction.getQuantity());
            }
        }

        transaction.setDeleted(true);
        transaction.setDeletedAt(LocalDateTime.now());
        transactionLogRepository.save(transaction);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. ACQUISTI / FORNITURE SETTIMANALI (Purchases)
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<GvPurchaseDTO> getPurchases(Long tabacchinoId, String period) {
        LocalDate today = LocalDate.now();
        if ("month".equalsIgnoreCase(period)) {
            LocalDate start = today.withDayOfMonth(1);
            LocalDate end = today.withDayOfMonth(today.lengthOfMonth());
            return purchaseRepository.findByTabacchinoIdAndPurchaseDateBetweenAndDeletedFalse(tabacchinoId, start, end)
                    .stream().map(this::toPurchaseDTO).collect(Collectors.toList());
        } else if ("stecche_week".equalsIgnoreCase(period) || "week".equalsIgnoreCase(period)) {
            // Ciclo fornitura stecche: reset ogni domenica.
            // La nuova settimana inizia la domenica e termina il sabato successivo.
            int dayOfWeek = today.getDayOfWeek().getValue(); // 1 = Lunedì, ..., 7 = Domenica
            LocalDate cycleStart = (dayOfWeek == 7) ? today : today.minusDays(dayOfWeek);
            LocalDate cycleEnd = cycleStart.plusDays(6);
            return purchaseRepository.findByTabacchinoIdAndPurchaseDateBetweenAndDeletedFalse(tabacchinoId, cycleStart, cycleEnd)
                    .stream().map(this::toPurchaseDTO).collect(Collectors.toList());
        }
        return purchaseRepository.findByTabacchinoIdAndDeletedFalseOrderByPurchaseDateDesc(tabacchinoId)
                .stream().map(this::toPurchaseDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GvPurchaseDTO> getPurchasesThisWeek(Long tabacchinoId) {
        return getPurchases(tabacchinoId, "stecche_week");
    }

    public GvPurchaseDTO addPurchase(Long tabacchinoId, GvPurchaseCreateRequest request) {
        Tabacchino tabacchino = getTabacchino(tabacchinoId);
        LocalDate pDate = request.getPurchaseDate() != null ? request.getPurchaseDate() : LocalDate.now();
        GvPurchase purchase = new GvPurchase(
                tabacchino,
                request.getAmount(),
                request.getPacksCount() != null ? request.getPacksCount() : 1,
                request.getSupplier() != null ? request.getSupplier() : "Logista Italia S.p.A.",
                request.getDescription(),
                pDate
        );
        purchase.setPrice(request.getPrice());
        GvPurchase saved = purchaseRepository.save(purchase);
        return toPurchaseDTO(saved);
    }

    public static int getTicketsPerStecca(double price) {
        if (Math.abs(price - 0.50) < 0.01) return 600;
        if (Math.abs(price - 1.00) < 0.01) return 300;
        if (Math.abs(price - 2.00) < 0.01) return 150;
        if (Math.abs(price - 3.00) < 0.01) return 100;
        if (Math.abs(price - 5.00) < 0.01) return 60;
        if (Math.abs(price - 10.00) < 0.01) return 30;
        if (Math.abs(price - 20.00) < 0.01) return 15;
        return (int) Math.max(1, Math.round(300.0 / price));
    }

    public GvPurchaseDTO addSteccaPurchase(Long tabacchinoId, BigDecimal price, int delta) {
        Tabacchino tabacchino = getTabacchino(tabacchinoId);
        LocalDate today = LocalDate.now();

        if (delta > 0) {
            int ticketsPerStecca = getTicketsPerStecca(price.doubleValue());
            int totalTickets = delta * ticketsPerStecca;
            BigDecimal steccaPrice = new BigDecimal("300.00");
            BigDecimal totalAmount = steccaPrice.multiply(BigDecimal.valueOf(delta));

            String formattedPrice = "\u20AC " + String.format(java.util.Locale.ITALIAN, "%.2f", price.doubleValue());
            String desc = delta == 1
                    ? String.format("1 stecca da %s (%d pz)", formattedPrice, totalTickets)
                    : String.format("%d stecche da %s (%d pz)", delta, formattedPrice, totalTickets);

            GvPurchase purchase = new GvPurchase(
                    tabacchino,
                    totalAmount,
                    delta,
                    "Logista Italia S.p.A.",
                    desc,
                    today
            );
            purchase.setPrice(price);
            GvPurchase saved = purchaseRepository.save(purchase);
            return toPurchaseDTO(saved);
        } else if (delta < 0) {
            // Storno di una stecca per questo prezzo
            List<GvPurchase> list = purchaseRepository.findByTabacchinoIdAndDeletedFalseOrderByPurchaseDateDesc(tabacchinoId);
            for (GvPurchase p : list) {
                boolean matchPrice = (p.getPrice() != null && p.getPrice().compareTo(price) == 0);
                boolean matchDesc = (p.getDescription() != null && p.getDescription().contains(String.format(java.util.Locale.ITALIAN, "%.2f", price.doubleValue())));
                if (matchPrice || matchDesc) {
                    int currentQty = p.getQuantity() != null ? p.getQuantity() : 1;
                    if (currentQty <= 1) {
                        p.setDeleted(true);
                        p.setDeletedAt(LocalDateTime.now());
                        purchaseRepository.save(p);
                        return toPurchaseDTO(p);
                    } else {
                        int newQty = currentQty - 1;
                        p.setQuantity(newQty);
                        p.setAmount(new BigDecimal("300.00").multiply(BigDecimal.valueOf(newQty)));
                        int tickets = getTicketsPerStecca(price.doubleValue()) * newQty;
                        String formattedPrice = "\u20AC " + String.format(java.util.Locale.ITALIAN, "%.2f", price.doubleValue());
                        p.setDescription(newQty == 1
                                ? String.format("1 stecca da %s (%d pz)", formattedPrice, tickets)
                                : String.format("%d stecche da %s (%d pz)", newQty, formattedPrice, tickets));
                        GvPurchase updated = purchaseRepository.save(p);
                        return toPurchaseDTO(updated);
                    }
                }
            }
        }
        return null;
    }

    public void deletePurchase(Long tabacchinoId, Long id) {
        purchaseRepository.findById(id).ifPresent(p -> {
            if (p.getTabacchino().getId().equals(tabacchinoId)) {
                p.setDeleted(true);
                p.setDeletedAt(LocalDateTime.now());
                purchaseRepository.save(p);
            }
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. STATISTICHE AVANZATE (Day / Month / Year)
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public GvStatisticsDTO getStatistics(Long tabacchinoId, String period, LocalDate refDate) {
        if (refDate == null) {
            refDate = LocalDate.now();
        }
        String p = (period != null) ? period.trim().toLowerCase() : "day";
        if (!p.equals("day") && !p.equals("month") && !p.equals("year")) {
            p = "day";
        }

        LocalDate startDate;
        LocalDate endDate;
        LocalDateTime startDateTime;
        LocalDateTime endDateTime;
        String periodLabel;

        Locale itLocale = Locale.ITALIAN;

        if ("month".equals(p)) {
            startDate = refDate.withDayOfMonth(1);
            endDate = refDate.withDayOfMonth(refDate.lengthOfMonth());
            startDateTime = startDate.atStartOfDay();
            endDateTime = endDate.atTime(LocalTime.MAX);
            String rawMonth = refDate.format(DateTimeFormatter.ofPattern("MMMM yyyy", itLocale));
            periodLabel = rawMonth.substring(0, 1).toUpperCase() + rawMonth.substring(1);
        } else if ("year".equals(p)) {
            startDate = LocalDate.of(refDate.getYear(), 1, 1);
            endDate = LocalDate.of(refDate.getYear(), 12, 31);
            startDateTime = startDate.atStartOfDay();
            endDateTime = endDate.atTime(LocalTime.MAX);
            periodLabel = "Anno " + refDate.getYear();
        } else {
            // Day
            startDate = refDate;
            endDate = refDate;
            startDateTime = refDate.atStartOfDay();
            endDateTime = refDate.atTime(LocalTime.MAX);
            String rawDay = refDate.format(DateTimeFormatter.ofPattern("EEEE d MMMM yyyy", itLocale));
            periodLabel = rawDay.substring(0, 1).toUpperCase() + rawDay.substring(1);
        }

        GvStatisticsDTO stats = new GvStatisticsDTO();
        stats.setPeriod(p);
        stats.setPeriodLabel(periodLabel);
        stats.setReferenceDate(refDate.toString());

        // 1. Fasce di prezzo configurate
        List<GvPriceTier> priceTiers = priceTierRepository.findByTabacchinoIdOrderByPriceAsc(tabacchinoId);

        // 2. Query Vendite nel range di date (solo record attivi, esclusi soft-deleted)
        List<GvSale> sales = saleRepository.findByTabacchinoIdAndSaleDateBetweenAndDeletedFalse(tabacchinoId, startDate, endDate);

        // 3. Query Vincite nel range di date/orari
        List<GvWinning> winnings = winningRepository.findByTabacchinoIdAndRecordedAtBetweenAndDeletedFalseOrderByRecordedAtDesc(
                tabacchinoId, startDateTime, endDateTime
        );

        // 4. Query Forniture nel range
        List<GvPurchase> purchases = purchaseRepository.findByTabacchinoIdAndPurchaseDateBetweenAndDeletedFalse(
                tabacchinoId, startDate, endDate
        );

        // 5. Query Log Transazioni
        List<GvTransactionLog> transactions = transactionLogRepository.findByTabacchinoIdAndRecordedAtBetweenAndDeletedFalseOrderByRecordedAtDesc(
                tabacchinoId, startDateTime, endDateTime
        );

        // ── Calcolo Ripartizione Vendite per Fascia di Prezzo ───────────────
        Map<BigDecimal, Integer> tierCounts = new TreeMap<>();
        for (GvPriceTier pt : priceTiers) {
            tierCounts.put(pt.getPrice(), 0);
        }

        boolean hasSalesTransactions = transactions.stream().anyMatch(t ->
                "gv_add".equalsIgnoreCase(t.getType()) || "gv_sub".equalsIgnoreCase(t.getType()));

        // Lo storico movimenti è la fonte contabile: conserva anche le vendite precedenti a un reset.
        if (hasSalesTransactions) {
            for (GvTransactionLog t : transactions) {
                if (t.getPrice() != null) {
                    if ("gv_add".equalsIgnoreCase(t.getType())) {
                        int q = t.getQuantity() != null ? t.getQuantity() : 1;
                        tierCounts.merge(t.getPrice(), q, Integer::sum);
                    } else if ("gv_sub".equalsIgnoreCase(t.getType())) {
                        int q = t.getQuantity() != null ? t.getQuantity() : 1;
                        tierCounts.merge(t.getPrice(), -q, (old, val) -> Math.max(0, old + val));
                    }
                }
            }
        } else {
            // Compatibilità con dati creati prima dell'introduzione del transaction log.
            for (GvSale s : sales) {
                if (s.getQuantity() != null && s.getQuantity() > 0) {
                    tierCounts.merge(s.getPrice(), s.getQuantity(), Integer::sum);
                }
            }
        }

        BigDecimal totalRevenue = BigDecimal.ZERO;
        int totalTickets = 0;
        for (Map.Entry<BigDecimal, Integer> entry : tierCounts.entrySet()) {
            if (entry.getValue() > 0) {
                BigDecimal sub = entry.getKey().multiply(BigDecimal.valueOf(entry.getValue()));
                totalRevenue = totalRevenue.add(sub);
                totalTickets += entry.getValue();
            }
        }

        BigDecimal totalAggio = totalRevenue.multiply(new BigDecimal("0.08")).setScale(2, RoundingMode.HALF_UP);

        // ── Calcolo Vincite ──────────────────────────────────────────────────
        BigDecimal totalWinnings = BigDecimal.ZERO;
        BigDecimal singleWinsAmount = BigDecimal.ZERO;
        int singleWinsCount = 0;
        BigDecimal closingWinsAmount = BigDecimal.ZERO;
        int closingWinsCount = 0;

        for (GvWinning w : winnings) {
            BigDecimal amt = w.getAmount() != null ? w.getAmount() : BigDecimal.ZERO;
            totalWinnings = totalWinnings.add(amt);
            if ("closing".equalsIgnoreCase(w.getType())) {
                closingWinsAmount = closingWinsAmount.add(amt);
                closingWinsCount++;
            } else {
                singleWinsAmount = singleWinsAmount.add(amt);
                singleWinsCount++;
            }
        }

        // ── Calcolo Forniture Stecche ─────────────────────────────────────────
        BigDecimal totalPurchases = BigDecimal.ZERO;
        int totalStecche = 0;
        int totalSteccheTickets = 0;
        Map<BigDecimal, int[]> purchasesByTier = new TreeMap<>();

        for (GvPurchase purchase : purchases) {
            BigDecimal amt = purchase.getAmount() != null ? purchase.getAmount() : BigDecimal.ZERO;
            totalPurchases = totalPurchases.add(amt);
            int qty = purchase.getQuantity() != null ? purchase.getQuantity() : 1;
            totalStecche += qty;

            BigDecimal pPrice = purchase.getPrice();
            if (pPrice == null && purchase.getDescription() != null) {
                java.util.regex.Matcher m = java.util.regex.Pattern.compile("da\\s*[^0-9]*([0-9]+(?:[.,][0-9]+)?)", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(purchase.getDescription());
                if (m.find()) {
                    pPrice = new BigDecimal(m.group(1).replace(',', '.'));
                }
            }
            if (pPrice != null) {
                int tPerSt = getTicketsPerStecca(pPrice.doubleValue());
                totalSteccheTickets += qty * tPerSt;
                purchasesByTier.computeIfAbsent(pPrice, k -> new int[2]);
                purchasesByTier.get(pPrice)[0] += qty;
                purchasesByTier.get(pPrice)[1] += qty * tPerSt;
            }
        }

        // ── Derivati: Saldo di cassa, Payout rate, Prezzo medio ──────────────
        BigDecimal netCashFlow = totalRevenue.subtract(totalWinnings);
        BigDecimal payoutRate = totalRevenue.compareTo(BigDecimal.ZERO) > 0
                ? totalWinnings.multiply(new BigDecimal("100")).divide(totalRevenue, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        BigDecimal avgPrice = totalTickets > 0
                ? totalRevenue.divide(BigDecimal.valueOf(totalTickets), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        stats.setTotalRevenue(totalRevenue);
        stats.setTotalTickets(totalTickets);
        stats.setTotalAggio(totalAggio);
        stats.setTotalWinnings(totalWinnings);
        stats.setWinningsCount(winnings.size());
        stats.setNetCashFlow(netCashFlow);
        stats.setTotalPurchases(totalPurchases);
        stats.setTotalStecche(totalStecche);
        stats.setTotalSteccheTickets(totalSteccheTickets);
        stats.setAverageTicketPrice(avgPrice);
        stats.setPayoutRate(payoutRate);
        stats.setSingleWinningsAmount(singleWinsAmount);
        stats.setSingleWinningsCount(singleWinsCount);
        stats.setClosingWinningsAmount(closingWinsAmount);
        stats.setClosingWinningsCount(closingWinsCount);

        // ── Tier Stats Breakdown ─────────────────────────────────────────────
        List<GvStatisticsDTO.TierStat> tierStatList = new ArrayList<>();
        for (Map.Entry<BigDecimal, Integer> entry : tierCounts.entrySet()) {
            BigDecimal price = entry.getKey();
            int qty = entry.getValue();
            BigDecimal rev = price.multiply(BigDecimal.valueOf(qty));
            BigDecimal agg = rev.multiply(new BigDecimal("0.08")).setScale(2, RoundingMode.HALF_UP);
            BigDecimal share = totalRevenue.compareTo(BigDecimal.ZERO) > 0
                    ? rev.multiply(new BigDecimal("100")).divide(totalRevenue, 1, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            tierStatList.add(new GvStatisticsDTO.TierStat(price, qty, rev, agg, share));
        }
        stats.setTierStats(tierStatList);

        // ── Purchase Tier Breakdown ──────────────────────────────────────────
        List<GvStatisticsDTO.PurchaseTierStat> purchaseTierList = new ArrayList<>();
        for (Map.Entry<BigDecimal, int[]> entry : purchasesByTier.entrySet()) {
            BigDecimal price = entry.getKey();
            int stCount = entry.getValue()[0];
            int tkCount = entry.getValue()[1];
            BigDecimal cost = new BigDecimal("300.00").multiply(BigDecimal.valueOf(stCount));
            purchaseTierList.add(new GvStatisticsDTO.PurchaseTierStat(price, stCount, tkCount, cost));
        }
        stats.setPurchaseTierStats(purchaseTierList);

        // ── Punti Grafico ────────────────────────────────────────────────────
        List<GvStatisticsDTO.ChartPoint> chartPoints = new ArrayList<>();
        if ("day".equals(p)) {
            // 8 fasce orarie della giornata
            int[][] slots = {
                {6, 8}, {8, 10}, {10, 12}, {12, 14}, {14, 16}, {16, 18}, {18, 20}, {20, 23}
            };
            for (int[] slot : slots) {
                int hStart = slot[0];
                int hEnd = slot[1];
                String slotLabel = String.format("%02d:00", hEnd);
                String fullLabel = String.format("Fascia %02d:00 \u2013 %02d:00", hStart, hEnd);

                BigDecimal slotRev = BigDecimal.ZERO;
                BigDecimal slotWins = BigDecimal.ZERO;
                int slotTickets = 0;

                for (GvTransactionLog t : transactions) {
                    if (t.getRecordedAt() != null) {
                        int hour = t.getRecordedAt().getHour();
                        if (hour >= hStart && hour < hEnd) {
                            if ("gv_add".equalsIgnoreCase(t.getType())) {
                                slotRev = slotRev.add(t.getAmount() != null ? t.getAmount() : BigDecimal.ZERO);
                                slotTickets += t.getQuantity() != null ? t.getQuantity() : 1;
                            } else if ("gv_sub".equalsIgnoreCase(t.getType())) {
                                slotRev = slotRev.subtract(t.getAmount() != null ? t.getAmount() : BigDecimal.ZERO);
                                slotTickets -= t.getQuantity() != null ? t.getQuantity() : 1;
                            }
                        }
                    }
                }
                for (GvWinning w : winnings) {
                    if (w.getRecordedAt() != null) {
                        int hour = w.getRecordedAt().getHour();
                        if (hour >= hStart && hour < hEnd) {
                            slotWins = slotWins.add(w.getAmount() != null ? w.getAmount() : BigDecimal.ZERO);
                        }
                    }
                }

                slotRev = slotRev.max(BigDecimal.ZERO);
                slotTickets = Math.max(0, slotTickets);
                BigDecimal slotAggio = slotRev.multiply(new BigDecimal("0.08")).setScale(2, RoundingMode.HALF_UP);
                chartPoints.add(new GvStatisticsDTO.ChartPoint(slotLabel, fullLabel, slotRev, slotAggio, slotWins, slotTickets));
            }
        } else if ("month".equals(p)) {
            // Tutti i giorni del mese (1..lengthOfMonth)
            int len = refDate.lengthOfMonth();
            for (int d = 1; d <= len; d++) {
                LocalDate dayDate = refDate.withDayOfMonth(d);
                String dayLabel = String.format("%02d", d);
                String fullLabel = dayDate.format(DateTimeFormatter.ofPattern("EEEE d MMMM", itLocale));

                BigDecimal dayRev = BigDecimal.ZERO;
                int dayTickets = 0;
                for (GvTransactionLog t : transactions) {
                    if (t.getRecordedAt() != null && dayDate.equals(t.getRecordedAt().toLocalDate()) && t.getPrice() != null) {
                        int quantity = t.getQuantity() != null ? t.getQuantity() : 1;
                        if ("gv_add".equalsIgnoreCase(t.getType())) {
                            dayRev = dayRev.add(t.getPrice().multiply(BigDecimal.valueOf(quantity)));
                            dayTickets += quantity;
                        } else if ("gv_sub".equalsIgnoreCase(t.getType())) {
                            dayRev = dayRev.subtract(t.getPrice().multiply(BigDecimal.valueOf(quantity)));
                            dayTickets -= quantity;
                        }
                    }
                }
                dayRev = dayRev.max(BigDecimal.ZERO);
                dayTickets = Math.max(0, dayTickets);

                BigDecimal dayWins = BigDecimal.ZERO;
                for (GvWinning w : winnings) {
                    if (w.getRecordedAt() != null && dayDate.equals(w.getRecordedAt().toLocalDate())) {
                        dayWins = dayWins.add(w.getAmount() != null ? w.getAmount() : BigDecimal.ZERO);
                    }
                }

                BigDecimal dayAggio = dayRev.multiply(new BigDecimal("0.08")).setScale(2, RoundingMode.HALF_UP);
                chartPoints.add(new GvStatisticsDTO.ChartPoint(dayLabel, fullLabel, dayRev, dayAggio, dayWins, dayTickets));
            }
        } else if ("year".equals(p)) {
            // Tutti i 12 mesi dell'anno
            String[] monthShort = {"Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"};
            String[] monthFull = {"Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"};

            for (int m = 1; m <= 12; m++) {
                String mShort = monthShort[m - 1];
                String mFull = monthFull[m - 1] + " " + refDate.getYear();

                BigDecimal monthRev = BigDecimal.ZERO;
                int monthTickets = 0;
                for (GvTransactionLog t : transactions) {
                    if (t.getRecordedAt() != null && t.getRecordedAt().getMonthValue() == m && t.getPrice() != null) {
                        int quantity = t.getQuantity() != null ? t.getQuantity() : 1;
                        if ("gv_add".equalsIgnoreCase(t.getType())) {
                            monthRev = monthRev.add(t.getPrice().multiply(BigDecimal.valueOf(quantity)));
                            monthTickets += quantity;
                        } else if ("gv_sub".equalsIgnoreCase(t.getType())) {
                            monthRev = monthRev.subtract(t.getPrice().multiply(BigDecimal.valueOf(quantity)));
                            monthTickets -= quantity;
                        }
                    }
                }
                monthRev = monthRev.max(BigDecimal.ZERO);
                monthTickets = Math.max(0, monthTickets);

                BigDecimal monthWins = BigDecimal.ZERO;
                for (GvWinning w : winnings) {
                    if (w.getRecordedAt() != null && w.getRecordedAt().getMonthValue() == m) {
                        monthWins = monthWins.add(w.getAmount() != null ? w.getAmount() : BigDecimal.ZERO);
                    }
                }

                BigDecimal monthAggio = monthRev.multiply(new BigDecimal("0.08")).setScale(2, RoundingMode.HALF_UP);
                chartPoints.add(new GvStatisticsDTO.ChartPoint(mShort, mFull, monthRev, monthAggio, monthWins, monthTickets));
            }
        }

        stats.setChartPoints(chartPoints);
        return stats;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helper Methods
    // ─────────────────────────────────────────────────────────────────────────

    private Tabacchino getTabacchino(Long tabacchinoId) {
        return tabacchinoRepository.findById(tabacchinoId)
                .orElseThrow(() -> new RuntimeException("Tabacchino non trovato con id: " + tabacchinoId));
    }

    private GvPriceTierDTO toPriceTierDTO(GvPriceTier entity) {
        return new GvPriceTierDTO(entity.getId(), entity.getPrice(), entity.getCreatedAt());
    }

    private GvSaleDTO toSaleDTO(GvSale entity) {
        return new GvSaleDTO(entity.getId(), entity.getPrice(), entity.getQuantity(), entity.getSaleDate(), entity.getUpdatedAt());
    }

    private GvWinningDTO toWinningDTO(GvWinning entity) {
        return new GvWinningDTO(entity.getId(), entity.getAmount(), entity.getTier(), entity.getType(),
                entity.getTimeRecorded(), entity.getRecordedAt(), entity.getNote());
    }

    private GvTransactionLogDTO toTransactionLogDTO(GvTransactionLog entity) {
        GvTransactionLogDTO dto = new GvTransactionLogDTO(entity.getId(), entity.getType(), entity.getPrice(), entity.getQuantity(),
                entity.getAmount(), entity.getTier(), entity.getLabel(), entity.getTimeRecorded(), entity.getRecordedAt());
        dto.setRelatedEntityId(entity.getRelatedEntityId());
        return dto;
    }

    private GvPurchaseDTO toPurchaseDTO(GvPurchase entity) {
        GvPurchaseDTO dto = new GvPurchaseDTO(
                entity.getId(),
                entity.getAmount(),
                entity.getQuantity(),
                entity.getSupplier(),
                entity.getDescription(),
                entity.getPurchaseDate(),
                entity.getCreatedAt()
        );
        dto.setPrice(entity.getPrice());
        return dto;
    }
}
