package com.ll.guardian.domain.alarm.dto;

import com.ll.guardian.domain.alarm.entity.MedicationLog;
import java.time.LocalDateTime;

public record MedicationLogResponse(
        Long id,
        Long planId,
        Long medicineId,
        String medicineName,
        LocalDateTime logTimestamp,
        String notes) {

    public static MedicationLogResponse from(MedicationLog log) {
        return new MedicationLogResponse(
                log.getId(),
                log.getAlarm() != null ? log.getAlarm().getId() : null,
                log.getMedicine().getId(),
                log.getMedicine().getName(),
                log.getLogTimestamp(),
                log.getNotes());
    }
}
