package it.gestionalegv.backend.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.Collection;

/**
 * Utente autenticato con l'ID del Tabacchino: evita di rileggerlo dal database a ogni richiesta.
 */
public class TabacchinoUserDetails extends User {

    private final Long tabacchinoId;

    public TabacchinoUserDetails(Long tabacchinoId, String email, String password, boolean enabled,
                                 Collection<? extends GrantedAuthority> authorities) {
        super(email, password, enabled, true, true, true, authorities);
        this.tabacchinoId = tabacchinoId;
    }

    public Long getTabacchinoId() {
        return tabacchinoId;
    }
}
