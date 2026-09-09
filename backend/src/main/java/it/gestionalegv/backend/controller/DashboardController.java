package it.gestionalegv.backend.controller;

import it.gestionalegv.backend.dto.DashboardStatsDTO;
import it.gestionalegv.backend.security.SecurityUtils;
import it.gestionalegv.backend.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller REST per la Dashboard principale.
 * Fornisce le metriche aggregate reali (vendite, vincite, acquisti, aggio, trend) calcolate dal DB.
 */
@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;
    private final SecurityUtils securityUtils;

    public DashboardController(DashboardService dashboardService, SecurityUtils securityUtils) {
        this.dashboardService = dashboardService;
        this.securityUtils = securityUtils;
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDTO> getStats(@RequestParam(defaultValue = "today") String period) {
        Long tabacchinoId = securityUtils.getCurrentTabacchinoId();
        DashboardStatsDTO stats = dashboardService.getDashboardStats(tabacchinoId, period);
        return ResponseEntity.ok(stats);
    }
}
