package com.ll.guardian.domain.admin.dto;

import java.util.List;

public record AdminMedicationPlanSummary(
        String medicineName,
        String alarmTime,
        List<String> daysOfWeek
) {
}

