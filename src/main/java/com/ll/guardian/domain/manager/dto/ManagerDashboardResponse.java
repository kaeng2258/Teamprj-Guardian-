package com.ll.guardian.domain.manager.dto;

import java.util.List;

public record ManagerDashboardResponse(
        Long managerId,
        List<ManagerClientSummary> clients,
        long activeAlertCount,
        long pendingMedicationCount) {}
