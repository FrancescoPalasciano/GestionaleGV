package it.gestionalegv.backend.security;

import it.gestionalegv.backend.model.Tabacchino;
import it.gestionalegv.backend.repository.TabacchinoRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Utility per accedere alle informazioni dell'utente (Tabacchino) attualmente autenticato.
 */
@Component
public class SecurityUtils {

    private final TabacchinoRepository tabacchinoRepository;

    public SecurityUtils(TabacchinoRepository tabacchinoRepository) {
        this.tabacchinoRepository = tabacchinoRepository;
    }

    /**
     * Recupera l'entità Tabacchino associata all'utente autenticato nella sessione corrente.
     *
     * @return Tabacchino attualmente autenticato
     * @throws RuntimeException se l'utente non è autenticato o non trovato
     */
    public Tabacchino getCurrentTabacchino() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new RuntimeException("Utente non autenticato nel contesto di sicurezza");
        }

        String email = auth.getName();
        return tabacchinoRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Tabacchino non trovato per l'email: " + email));
    }

    /**
     * Restituisce l'ID del Tabacchino correntemente autenticato.
     *
     * @return ID del tabacchino
     */
    public Long getCurrentTabacchinoId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof TabacchinoUserDetails principal) {
            return principal.getTabacchinoId();
        }
        return getCurrentTabacchino().getId();
    }
}
