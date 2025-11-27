package com.ll.guardian.domain.admin.dto;

import java.time.LocalDate;

public record MedicationAdherenceResponse(
        LocalDate from,
        LocalDate to,
        double adherenceRate
) {
}