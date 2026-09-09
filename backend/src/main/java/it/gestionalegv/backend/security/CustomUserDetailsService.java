package it.gestionalegv.backend.security;

import it.gestionalegv.backend.model.Tabacchino;
import it.gestionalegv.backend.repository.TabacchinoRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Carica i dati dell'utente dal database per l'autenticazione Spring Security.
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final TabacchinoRepository repository;

    public CustomUserDetailsService(TabacchinoRepository repository) {
        this.repository = repository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Tabacchino tabacchino = repository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Utente non trovato con email: " + email));

        return new User(
                tabacchino.getEmail(),
                tabacchino.getPassword(),
                tabacchino.getActive(),       // enabled
                true,                          // accountNonExpired
                true,                          // credentialsNonExpired
                true,                          // accountNonLocked
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }
}
