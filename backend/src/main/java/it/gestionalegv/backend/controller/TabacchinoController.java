package it.gestionalegv.backend.controller;

import it.gestionalegv.backend.dto.TabacchinoCreateDTO;
import it.gestionalegv.backend.dto.TabacchinoResponseDTO;
import it.gestionalegv.backend.service.TabacchinoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tabacchini")
public class TabacchinoController {

    private final TabacchinoService service;

    public TabacchinoController(TabacchinoService service) {
        this.service = service;
    }

    // ── GET  /api/v1/tabacchini ─────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<TabacchinoResponseDTO>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    // ── GET  /api/v1/tabacchini/{id} ────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<TabacchinoResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    // ── POST /api/v1/tabacchini ─────────────────────────────────────────
    @PostMapping
    public ResponseEntity<TabacchinoResponseDTO> create(@Valid @RequestBody TabacchinoCreateDTO dto) {
        TabacchinoResponseDTO created = service.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ── PUT  /api/v1/tabacchini/{id} ────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<TabacchinoResponseDTO> update(@PathVariable Long id,
                                                        @Valid @RequestBody TabacchinoCreateDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    // ── PATCH /api/v1/tabacchini/{id}/active ────────────────────────────
    @PatchMapping("/{id}/active")
    public ResponseEntity<TabacchinoResponseDTO> toggleActive(@PathVariable Long id,
                                                              @RequestParam boolean active) {
        return ResponseEntity.ok(service.toggleActive(id, active));
    }

    // ── DELETE /api/v1/tabacchini/{id} ──────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(Map.of("message", "Tabacchino eliminato con successo"));
    }
}
