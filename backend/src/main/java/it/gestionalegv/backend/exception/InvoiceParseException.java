package it.gestionalegv.backend.exception;

/**
 * Sollevata quando il PDF caricato non è un dettaglio ordine Lottomatica leggibile.
 */
public class InvoiceParseException extends RuntimeException {

    public InvoiceParseException(String message) {
        super(message);
    }

    public InvoiceParseException(String message, Throwable cause) {
        super(message, cause);
    }
}
