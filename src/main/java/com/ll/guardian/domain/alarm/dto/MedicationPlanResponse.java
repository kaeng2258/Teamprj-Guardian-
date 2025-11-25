package com.ll.guardian.domain.alarm.dto;

import com.ll.guardian.domain.alarm.entity.MedicationAlarm;
import com.ll.guardian.domain.matching.entity.CareMatch;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;

public record MedicationPlanResponse(
        Long id,
        Long medicineId,
        String medicineName,
        Integer dosageAmount,
        String dosageUnit,
        LocalTime alarmTime,
        List<String> daysOfWeek,
        boolean active,
        Long managerId,
        String managerName,
        String managerEmail) {

    public static MedicationPlanResponse from(MedicationAlarm alarm) {
        return from(alarm, null);
    }

    public static MedicationPlanResponse from(MedicationAlarm alarm, CareMatch match) {
        List<String> days = alarm.getDaysOfWeek() == null
                ? List.of()
                : Arrays.stream(alarm.getDaysOfWeek().split(",")).map(String::trim).toList();
        return new MedicationPlanResponse(
                alarm.getId(),
                alarm.getMedicine().getId(),
                alarm.getMedicine().getName(),
                alarm.getDosageAmount(),
                alarm.getDosageUnit(),
                alarm.getAlarmTime(),
                days,
                alarm.isActive(),
                match != null ? match.getManager().getId() : null,
                match != null ? match.getManager().getName() : null,
                match != null ? match.getManager().getEmail() : null);
    }
}
