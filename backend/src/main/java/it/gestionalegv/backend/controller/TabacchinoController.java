package it.gestionalegv.backend.controller;

import it.gestionalegv.backend.dto.TabacchinoResponseDTO;
import it.gestionalegv.backend.security.SecurityUtils;
import it.gestionalegv.backend.service.TabacchinoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Espone esclusivamente il profilo dell'utente autenticato. */
@RestController
@RequestMapping("/api/v1/tabacchini")
public class TabacchinoController {

    private final TabacchinoService service;
    private final SecurityUtils securityUtils;

    public TabacchinoController(TabacchinoService service, SecurityUtils securityUtils) {
        this.service = service;
        this.securityUtils = securityUtils;
    }

    @GetMapping("/me")
    public ResponseEntity<TabacchinoResponseDTO> getCurrentUser() {
        return ResponseEntity.ok(service.findById(securityUtils.getCurrentTabacchinoId()));
    }
}
