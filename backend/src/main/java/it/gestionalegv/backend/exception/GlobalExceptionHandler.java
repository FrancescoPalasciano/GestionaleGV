package it.gestionalegv.backend.exception;

import it.gestionalegv.backend.dto.ErrorResponseDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * Gestione globale delle eccezioni — nessun stack trace viene mai esposto al client.
 * Tutte le risposte usano il formato uniforme {@link ErrorResponseDTO}.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ── 400 — Errori di validazione Bean Validation ─────────────────────
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponseDTO> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }

        ErrorResponseDTO response = new ErrorResponseDTO(
                400,
                "Errore di validazione",
                "Uno o più campi non sono validi",
                fieldErrors
        );
        return ResponseEntity.badRequest().body(response);
    }

    // ── 401 — Credenziali non valide ────────────────────────────────────
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponseDTO> handleBadCredentials(BadCredentialsException ex) {
        ErrorResponseDTO response = new ErrorResponseDTO(
                401,
                "Autenticazione fallita",
                "Email o password non corretti"
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponseDTO> handleAuthentication(AuthenticationException ex) {
        ErrorResponseDTO response = new ErrorResponseDTO(
                401,
                "Autenticazione fallita",
                "Autenticazione richiesta per accedere a questa risorsa"
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    // ── 403 — Account disabilitato / accesso negato ─────────────────────
    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ErrorResponseDTO> handleDisabled(DisabledException ex) {
        ErrorResponseDTO response = new ErrorResponseDTO(
                403,
                "Account disabilitato",
                "Il tuo account è stato disabilitato. Contatta l'amministratore"
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponseDTO> handleAccessDenied(AccessDeniedException ex) {
        ErrorResponseDTO response = new ErrorResponseDTO(
                403,
                "Accesso negato",
                "Non hai i permessi per accedere a questa risorsa"
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    // ── 404 — Risorsa non trovata ───────────────────────────────────────
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponseDTO> handleNotFound(IllegalArgumentException ex) {
        ErrorResponseDTO response = new ErrorResponseDTO(
                404,
                "Risorsa non trovata",
                ex.getMessage()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    // ── 409 — Conflitto (es. email duplicata) ───────────────────────────
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponseDTO> handleConflict(IllegalStateException ex) {
        ErrorResponseDTO response = new ErrorResponseDTO(
                409,
                "Conflitto",
                ex.getMessage()
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    // ── 500 — Errore generico (nessun stack trace esposto) ──────────────
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponseDTO> handleGeneric(Exception ex) {
        ErrorResponseDTO response = new ErrorResponseDTO(
                500,
                "Errore interno del server",
                "Si è verificato un errore imprevisto. Riprova più tardi"
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
