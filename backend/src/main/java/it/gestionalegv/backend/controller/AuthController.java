package it.gestionalegv.backend.controller;

import it.gestionalegv.backend.dto.AuthResponseDTO;
import it.gestionalegv.backend.dto.ErrorResponseDTO;
import it.gestionalegv.backend.dto.LoginRequestDTO;
import it.gestionalegv.backend.dto.TabacchinoCreateDTO;
import it.gestionalegv.backend.model.Tabacchino;
import it.gestionalegv.backend.repository.TabacchinoRepository;
import it.gestionalegv.backend.security.JwtProvider;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller di autenticazione — endpoint pubblici per login e registrazione.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final TabacchinoRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    public AuthController(AuthenticationManager authenticationManager,
                          TabacchinoRepository repository,
                          PasswordEncoder passwordEncoder,
                          JwtProvider jwtProvider) {
        this.authenticationManager = authenticationManager;
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.jwtProvider = jwtProvider;
    }

    // ── POST /api/v1/auth/register ──────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody TabacchinoCreateDTO dto) {
        if (repository.existsByEmail(dto.getEmail())) {
            ErrorResponseDTO error = new ErrorResponseDTO(
                    409,
                    "Conflitto",
                    "Email già registrata"
            );
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        }

        Tabacchino tabacchino = new Tabacchino();
        tabacchino.setEmail(dto.getEmail());
        tabacchino.setPassword(passwordEncoder.encode(dto.getPassword()));
        tabacchino.setActive(true);

        // Dati anagrafici e della rivendita
        tabacchino.setNome(dto.getNome());
        tabacchino.setCognome(dto.getCognome());
        tabacchino.setRagioneSociale(dto.getRagioneSociale());
        tabacchino.setCodiceFiscale(dto.getCodiceFiscale());
        tabacchino.setPartitaIva(dto.getPartitaIva());
        tabacchino.setCodiceRivendita(dto.getCodiceRivendita());
        tabacchino.setTelefono(dto.getTelefono());
        tabacchino.setIndirizzo(dto.getIndirizzo());

        Tabacchino saved = repository.save(tabacchino);

        String token = jwtProvider.generateToken(saved.getId(), saved.getEmail(), saved.getActive());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(new AuthResponseDTO(token, saved.getId(), saved.getEmail()));
    }

    // ── POST /api/v1/auth/login ─────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDTO dto) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(dto.getEmail(), dto.getPassword())
            );
        } catch (BadCredentialsException e) {
            ErrorResponseDTO error = new ErrorResponseDTO(
                    401,
                    "Autenticazione fallita",
                    "Email o password non corretti"
            );
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        } catch (DisabledException e) {
            ErrorResponseDTO error = new ErrorResponseDTO(
                    403,
                    "Account disabilitato",
                    "Il tuo account è stato disabilitato. Contatta l'amministratore"
            );
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }

        Tabacchino tabacchino = repository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("Utente non trovato dopo autenticazione"));

        String token = jwtProvider.generateToken(tabacchino.getId(), tabacchino.getEmail(), tabacchino.getActive());

        return ResponseEntity.ok(new AuthResponseDTO(token, tabacchino.getId(), tabacchino.getEmail()));
    }
}
