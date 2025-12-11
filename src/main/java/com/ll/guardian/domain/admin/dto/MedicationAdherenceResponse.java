package com.ll.guardian.domain.admin.dto;

import java.time.LocalDate;
import java.util.List;

public record MedicationAdherenceResponse(
        LocalDate from,
        LocalDate to,
        double adherenceRate,
        List<MonthlyPoint> points
) {
    public record MonthlyPoint(String month, double rate) {}
}
