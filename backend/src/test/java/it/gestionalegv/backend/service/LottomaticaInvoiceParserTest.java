package it.gestionalegv.backend.service;

import it.gestionalegv.backend.dto.GvInvoiceLineDTO;
import it.gestionalegv.backend.dto.GvInvoicePreviewDTO;
import it.gestionalegv.backend.exception.InvoiceParseException;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LottomaticaInvoiceParserTest {

    // Testo estratto da PDFBox da un "Dettaglio Ordine" reale (l'€ arriva come glifo U+0080)
    private static final String ORDER_TEXT = String.join("\n",
            "N.B. La stampa ha solo scopo riepilogativo di quanto è stato inserito. Gli ordini richiesti devono",
            "essere considerati in lavorazione e possono essere soggetti a ulteriori verifiche da parte di Lotterie",
            "Nazionali",
            "PACCHI BIGLIETTI IMPORTO",
            "16 925 \u0080 4.150",
            "0,50 \u0080",
            "Fortuna in Tasca 1 200 \u0080 100",
            "1 \u0080",
            "Buondi 1 150 \u0080 150",
            "2 \u0080",
            "Fai Scopa Bonus 1 75 \u0080 150",
            "3 \u0080",
            "Numeri Fortunati New 1 50 \u0080 150",
            "5 \u0080",
            "New Tutto per Tutto 1 60 \u0080 300",
            "Doppia Sfida Classic 1 60 \u0080 300",
            "20X NEW 1 60 \u0080 300",
            "Miliardario New 1 60 \u0080 300",
            "NUMERISSIMI 1 60 \u0080 300",
            "10 \u0080",
            "Super Numerissimi 1 30 \u0080 300",
            "50X NEW 1 30 \u0080 300",
            "Mega Miliardario New 1 30 \u0080 300",
            "20 \u0080",
            "100X NEW 2 30 \u0080 600",
            "Maxi Miliardario New 2 30 \u0080 600",
            "Costi",
            "Spedizione 0",
            "PACCHI BIGLIETTI IMPORTO",
            "16 925 \u0080 4.150",
            "Ordine effettuato il 23/10/2026 - 15:15",
            "");

    private final LottomaticaInvoiceParser parser = new LottomaticaInvoiceParser();

    @Test
    void parsesEveryGameWithItsPriceTier() {
        GvInvoicePreviewDTO preview = parser.parseText(ORDER_TEXT);

        List<GvInvoiceLineDTO> lines = preview.getLines();
        assertEquals(14, lines.size());
        assertLine(lines.get(0), "0.50", "Fortuna in Tasca", 1, 200, "100");
        assertLine(lines.get(3), "3", "Numeri Fortunati New", 1, 50, "150");
        assertLine(lines.get(6), "5", "20X NEW", 1, 60, "300");
        assertLine(lines.get(10), "10", "50X NEW", 1, 30, "300");
        assertLine(lines.get(13), "20", "Maxi Miliardario New", 2, 30, "600");

        assertEquals(16, preview.getTotalPacks());
        assertEquals(925, preview.getTotalTickets());
        assertEquals(0, new BigDecimal("4150").compareTo(preview.getTotalAmount()));
        assertEquals(LocalDate.of(2026, 10, 23), preview.getOrderDate());
        assertTrue(preview.getWarnings().isEmpty(), () -> "Avvisi inattesi: " + preview.getWarnings());
    }

    @Test
    void warnsWhenRowsDoNotMatchInvoiceTotals() {
        String tampered = ORDER_TEXT.replace("Buondi 1 150 \u0080 150\n", "");

        GvInvoicePreviewDTO preview = parser.parseText(tampered);

        assertEquals(13, preview.getLines().size());
        assertTrue(preview.getWarnings().stream().anyMatch(w -> w.startsWith("I totali della fattura")));
    }

    @Test
    void rejectsDocumentsWithoutGames() {
        assertThrows(InvoiceParseException.class, () -> parser.parseText("Fattura qualsiasi\nTotale 100"));
    }

    private static void assertLine(GvInvoiceLineDTO line, String price, String game, int packs, int tickets, String amount) {
        assertEquals(0, new BigDecimal(price).compareTo(line.getPrice()), "prezzo di " + game);
        assertEquals(game, line.getGame());
        assertEquals(packs, line.getPacks());
        assertEquals(tickets, line.getTickets());
        assertEquals(0, new BigDecimal(amount).compareTo(line.getAmount()), "importo di " + game);
    }
}
