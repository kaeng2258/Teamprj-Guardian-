package com.ll.guardian.domain.provider.controller;

import com.ll.guardian.domain.provider.dto.ProviderDashboardResponse;
import com.ll.guardian.domain.provider.service.ProviderDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/providers/{providerId}/dashboard")
public class ProviderDashboardController {

    private final ProviderDashboardService providerDashboardService;

    public ProviderDashboardController(ProviderDashboardService providerDashboardService) {
        this.providerDashboardService = providerDashboardService;
    }

    @GetMapping
    public ResponseEntity<ProviderDashboardResponse> getDashboard(@PathVariable Long providerId) {
        ProviderDashboardResponse response = providerDashboardService.getDashboard(providerId);
        return ResponseEntity.ok(response);
    }
}
