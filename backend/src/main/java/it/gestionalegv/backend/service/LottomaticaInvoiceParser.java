package it.gestionalegv.backend.service;

import it.gestionalegv.backend.dto.GvInvoiceLineDTO;
import it.gestionalegv.backend.dto.GvInvoicePreviewDTO;
import it.gestionalegv.backend.exception.InvoiceParseException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Legge il PDF "Dettaglio Ordine" rilasciato da Lottomatica / Lotterie Nazionali.
 *
 * Struttura attesa del testo (ordinato per posizione):
 * <pre>
 * PACCHI BIGLIETTI IMPORTO
 * 16 925 € 4.150            ← totali ordine
 * 0,50 €                    ← fascia di prezzo
 * Fortuna in Tasca 1 200 € 100
 * 5 €
 * New Tutto per Tutto 1 60 € 300
 * ...
 * Costi                     ← fine elenco giochi
 * Ordine effettuato il 23/10/2026 - 15:15
 * </pre>
 */
@Component
public class LottomaticaInvoiceParser {

    private static final int MAX_PAGES = 10;

    // Simbolo valuta opzionale: nel PDF l'€ è spesso un glifo non standard, quindi accetta un qualsiasi simbolo
    private static final String CURRENCY = "[^\\p{L}\\p{N}\\s]?";
    private static final String AMOUNT = "(\\d{1,3}(?:\\.\\d{3})*(?:,\\d{1,2})?|\\d+(?:,\\d{1,2})?)";

    private static final Pattern HEADER = Pattern.compile("^PACCHI\\s+BIGLIETTI\\s+IMPORTO$", Pattern.CASE_INSENSITIVE);
    private static final Pattern TOTALS = Pattern.compile("^(\\d+)\\s+(\\d+)\\s+" + CURRENCY + "\\s*" + AMOUNT + "$");
    private static final Pattern TIER = Pattern.compile("^(\\d{1,3}(?:,\\d{1,2})?)\\s*" + CURRENCY + "$");
    private static final Pattern ITEM = Pattern.compile("^(.*?\\p{L}.*?)\\s+(\\d+)\\s+(\\d+)\\s+" + CURRENCY + "\\s*" + AMOUNT + "$");
    private static final Pattern END_OF_ITEMS = Pattern.compile("^Costi\\b.*", Pattern.CASE_INSENSITIVE);
    private static final Pattern ORDER_DATE = Pattern.compile("Ordine effettuato il\\s+(\\d{2}/\\d{2}/\\d{4})", Pattern.CASE_INSENSITIVE);
    private static final Pattern ORDER_NUMBER_IN_FILENAME = Pattern.compile("(\\d{5,20})");

    public GvInvoicePreviewDTO parse(byte[] pdfBytes, String filename) {
        String text;
        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            if (document.getNumberOfPages() > MAX_PAGES) {
                throw new InvoiceParseException("Il PDF ha troppe pagine per essere un dettaglio ordine Lottomatica");
            }
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            text = stripper.getText(document);
        } catch (IOException e) {
            throw new InvoiceParseException("Impossibile leggere il PDF: il file è danneggiato o protetto", e);
        }

        GvInvoicePreviewDTO preview = parseText(text);
        if (filename != null) {
            Matcher m = ORDER_NUMBER_IN_FILENAME.matcher(filename);
            if (m.find()) {
                preview.setOrderNumber(m.group(1));
            }
        }
        return preview;
    }

    GvInvoicePreviewDTO parseText(String text) {
        GvInvoicePreviewDTO preview = new GvInvoicePreviewDTO();
        BigDecimal currentPrice = null;
        boolean expectTotals = false;
        boolean itemsEnded = false;

        for (String rawLine : text.split("\\R")) {
            String line = rawLine.replace(' ', ' ').trim().replaceAll("\\s+", " ");
            if (line.isEmpty()) continue;

            if (HEADER.matcher(line).matches()) {
                expectTotals = true;
                continue;
            }
            if (expectTotals) {
                expectTotals = false;
                Matcher m = TOTALS.matcher(line);
                if (m.matches()) {
                    if (preview.getTotalPacks() == null) {
                        preview.setTotalPacks(Integer.parseInt(m.group(1)));
                        preview.setTotalTickets(Integer.parseInt(m.group(2)));
                        preview.setTotalAmount(parseAmount(m.group(3)));
                    }
                    continue;
                }
            }

            Matcher dateMatcher = ORDER_DATE.matcher(line);
            if (dateMatcher.find()) {
                try {
                    preview.setOrderDate(LocalDate.parse(dateMatcher.group(1), DateTimeFormatter.ofPattern("dd/MM/yyyy")));
                } catch (DateTimeParseException ignored) {
                    preview.getWarnings().add("Data ordine non leggibile: " + dateMatcher.group(1));
                }
                continue;
            }

            if (itemsEnded) continue;
            if (END_OF_ITEMS.matcher(line).matches()) {
                itemsEnded = true;
                continue;
            }

            Matcher tierMatcher = TIER.matcher(line);
            if (tierMatcher.matches()) {
                currentPrice = parseAmount(tierMatcher.group(1));
                continue;
            }

            // Tutto ciò che precede la prima fascia di prezzo è intestazione/nota legale
            if (currentPrice == null) continue;

            Matcher itemMatcher = ITEM.matcher(line);
            if (itemMatcher.matches()) {
                GvInvoiceLineDTO item = new GvInvoiceLineDTO(
                        currentPrice,
                        itemMatcher.group(1).trim(),
                        Integer.parseInt(itemMatcher.group(2)),
                        Integer.parseInt(itemMatcher.group(3)),
                        parseAmount(itemMatcher.group(4))
                );
                BigDecimal expected = item.getPrice().multiply(BigDecimal.valueOf(item.getTickets()));
                if (expected.compareTo(item.getAmount()) != 0) {
                    preview.getWarnings().add(String.format(
                            "%s: l'importo (€ %s) non corrisponde a %d biglietti da € %s",
                            item.getGame(), item.getAmount().toPlainString(), item.getTickets(), item.getPrice().toPlainString()));
                }
                preview.getLines().add(item);
            } else {
                preview.getWarnings().add("Riga non riconosciuta: " + line);
            }
        }

        if (preview.getLines().isEmpty()) {
            throw new InvoiceParseException("Nessuna stecca trovata: il PDF non sembra un dettaglio ordine Lottomatica");
        }

        int packs = preview.getLines().stream().mapToInt(GvInvoiceLineDTO::getPacks).sum();
        int tickets = preview.getLines().stream().mapToInt(GvInvoiceLineDTO::getTickets).sum();
        BigDecimal amount = preview.getLines().stream().map(GvInvoiceLineDTO::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        if (preview.getTotalPacks() != null
                && (preview.getTotalPacks() != packs
                    || preview.getTotalTickets() != tickets
                    || preview.getTotalAmount().compareTo(amount) != 0)) {
            preview.getWarnings().add(String.format(
                    "I totali della fattura (%d pacchi, %d biglietti, € %s) non corrispondono alle righe lette (%d pacchi, %d biglietti, € %s)",
                    preview.getTotalPacks(), preview.getTotalTickets(), preview.getTotalAmount().toPlainString(),
                    packs, tickets, amount.toPlainString()));
        }
        preview.setTotalPacks(packs);
        preview.setTotalTickets(tickets);
        preview.setTotalAmount(amount);
        return preview;
    }

    private static BigDecimal parseAmount(String raw) {
        // Formato italiano: "." separatore migliaia, "," decimali (es. "4.150", "0,50", "1.234,50")
        return new BigDecimal(raw.replace(".", "").replace(',', '.'));
    }
}
