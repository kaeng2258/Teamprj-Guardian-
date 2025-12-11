package com.ll.guardian.domain.admin.dto;

import java.util.List;

public record AdminMedicationSummaryResponse(
        Double adherenceRate,
        List<AdminMedicationPlanSummary> plans
) {

    public static AdminMedicationSummaryResponse empty() {
        return new AdminMedicationSummaryResponse(null, List.of());
    }
}

