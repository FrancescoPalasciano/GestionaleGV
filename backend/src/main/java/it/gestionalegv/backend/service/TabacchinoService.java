package it.gestionalegv.backend.service;

import it.gestionalegv.backend.dto.TabacchinoCreateDTO;
import it.gestionalegv.backend.dto.TabacchinoResponseDTO;
import it.gestionalegv.backend.model.Tabacchino;
import it.gestionalegv.backend.repository.TabacchinoRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TabacchinoService {

    private final TabacchinoRepository repository;
    private final PasswordEncoder passwordEncoder;

    public TabacchinoService(TabacchinoRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    // ── Conversione Model → DTO ────────────────────────────────────────

    private TabacchinoResponseDTO toDTO(Tabacchino entity) {
        return new TabacchinoResponseDTO(
                entity.getId(),
                entity.getEmail(),
                entity.getActive(),
                entity.getNome(),
                entity.getCognome(),
                entity.getRagioneSociale(),
                entity.getCodiceFiscale(),
                entity.getPartitaIva(),
                entity.getCodiceRivendita(),
                entity.getTelefono(),
                entity.getIndirizzo()
        );
    }

    // ── CRUD ───────────────────────────────────────────────────────────

    /**
     * Restituisce tutti i tabacchini.
     */
    public List<TabacchinoResponseDTO> findAll() {
        return repository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Restituisce un tabacchino per ID.
     *
     * @throws IllegalArgumentException se non trovato
     */
    public TabacchinoResponseDTO findById(Long id) {
        Tabacchino entity = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tabacchino non trovato con id: " + id));
        return toDTO(entity);
    }

    /**
     * Restituisce un tabacchino per email.
     *
     * @throws IllegalArgumentException se non trovato
     */
    public TabacchinoResponseDTO findByEmail(String email) {
        Tabacchino entity = repository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Tabacchino non trovato con email: " + email));
        return toDTO(entity);
    }

    /**
     * Crea un nuovo tabacchino con password hashata in BCrypt.
     *
     * @throws IllegalStateException se l'email è già registrata
     */
    public TabacchinoResponseDTO create(TabacchinoCreateDTO dto) {
        if (repository.existsByEmail(dto.getEmail())) {
            throw new IllegalStateException("Email già registrata: " + dto.getEmail());
        }

        Tabacchino entity = new Tabacchino();
        entity.setEmail(dto.getEmail());
        entity.setPassword(passwordEncoder.encode(dto.getPassword()));
        entity.setActive(true);

        Tabacchino saved = repository.save(entity);
        return toDTO(saved);
    }

    /**
     * Aggiorna email e/o password di un tabacchino esistente.
     *
     * @throws IllegalArgumentException se non trovato
     */
    public TabacchinoResponseDTO update(Long id, TabacchinoCreateDTO dto) {
        Tabacchino entity = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tabacchino non trovato con id: " + id));

        entity.setEmail(dto.getEmail());
        entity.setPassword(passwordEncoder.encode(dto.getPassword()));

        Tabacchino saved = repository.save(entity);
        return toDTO(saved);
    }

    /**
     * Attiva / disattiva un tabacchino (soft‑delete).
     *
     * @throws IllegalArgumentException se non trovato
     */
    public TabacchinoResponseDTO toggleActive(Long id, boolean active) {
        Tabacchino entity = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tabacchino non trovato con id: " + id));

        entity.setActive(active);
        Tabacchino saved = repository.save(entity);
        return toDTO(saved);
    }

    /**
     * Elimina un tabacchino per ID.
     *
     * @throws IllegalArgumentException se non trovato
     */
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new IllegalArgumentException("Tabacchino non trovato con id: " + id);
        }
        repository.deleteById(id);
    }
}
