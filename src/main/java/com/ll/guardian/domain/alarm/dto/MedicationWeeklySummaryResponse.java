package com.ll.guardian.domain.alarm.dto;

import java.time.LocalDate;
import java.util.List;

public record MedicationWeeklySummaryResponse(
        LocalDate startDate, LocalDate endDate, List<MedicationWeeklySummaryResponse.DayStatus> days) {

    public record DayStatus(
            LocalDate date,
            int scheduledCount,
            int takenCount,
            int manualLogCount,
            MedicationWeeklySummaryResponse.Status status) {}

    public enum Status {
        NO_SCHEDULE,
        MISSED,
        PARTIAL,
        COMPLETED
    }
}
