package com.ll.guardian.domain.manager.controller;

import com.ll.guardian.domain.manager.dto.ManagerDashboardResponse;
import com.ll.guardian.domain.manager.service.ManagerDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/managers/{managerId}/dashboard")
public class ManagerDashboardController {

    private final ManagerDashboardService managerDashboardService;

    public ManagerDashboardController(ManagerDashboardService managerDashboardService) {
        this.managerDashboardService = managerDashboardService;
    }

    @GetMapping
    public ResponseEntity<ManagerDashboardResponse> getDashboard(@PathVariable Long managerId) {
        ManagerDashboardResponse response = managerDashboardService.getDashboard(managerId);
        return ResponseEntity.ok(response);
    }
}
