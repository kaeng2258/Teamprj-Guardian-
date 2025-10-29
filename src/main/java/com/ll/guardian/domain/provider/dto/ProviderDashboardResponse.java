package com.ll.guardian.domain.provider.dto;

import java.util.List;

public record ProviderDashboardResponse(
        Long providerId,
        List<ProviderClientSummary> clients,
        long activeAlertCount,
        long pendingMedicationCount) {}
