package com.ll.guardian.domain.alarm.dto;

import com.ll.guardian.domain.alarm.entity.MedicationLog;
import java.time.LocalDateTime;

public record MedicationLogResponse(
        Long id,
        Long medicineId,
        String medicineName,
        LocalDateTime logTimestamp,
        String notes) {

    public static MedicationLogResponse from(MedicationLog log) {
        return new MedicationLogResponse(
                log.getId(),
                log.getMedicine().getId(),
                log.getMedicine().getName(),
                log.getLogTimestamp(),
                log.getNotes());
    }
}
