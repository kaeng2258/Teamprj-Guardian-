package com.ll.guardian.domain.alarm.dto;

import com.ll.guardian.domain.alarm.entity.MedicationAlarm;
import com.ll.guardian.domain.matching.entity.CareMatch;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;

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
        String managerEmail,
        List<Long> assignedManagerIds,
        List<String> assignedManagerNames,
        List<String> assignedManagerEmails) {

    public static MedicationPlanResponse from(MedicationAlarm alarm) {
        return from(alarm, List.of());
    }

    public static MedicationPlanResponse from(MedicationAlarm alarm, CareMatch match) {
        if (match == null) {
            return from(alarm, List.of());
        }
        return from(alarm, List.of(match));
    }

    public static MedicationPlanResponse from(MedicationAlarm alarm, List<CareMatch> matches) {
        List<String> days = alarm.getDaysOfWeek() == null
                ? List.of()
                : Arrays.stream(alarm.getDaysOfWeek().split(",")).map(String::trim).toList();
        List<CareMatch> safeMatches = matches == null ? List.of() : matches;
        List<CareMatch> distinctMatches = safeMatches.stream()
                .filter(Objects::nonNull)
                .filter(match -> match.getManager() != null)
                .toList();
        CareMatch first = distinctMatches.isEmpty() ? null : distinctMatches.get(0);
        List<Long> assignedManagerIds = distinctMatches.stream()
                .map(match -> match.getManager().getId())
                .distinct()
                .toList();
        List<String> assignedManagerNames = distinctMatches.stream()
                .map(match -> match.getManager().getName())
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        List<String> assignedManagerEmails = distinctMatches.stream()
                .map(match -> match.getManager().getEmail())
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        return new MedicationPlanResponse(
                alarm.getId(),
                alarm.getMedicine().getId(),
                alarm.getMedicine().getName(),
                alarm.getDosageAmount(),
                alarm.getDosageUnit(),
                alarm.getAlarmTime(),
                days,
                alarm.isActive(),
                first != null ? first.getManager().getId() : null,
                first != null ? first.getManager().getName() : null,
                first != null ? first.getManager().getEmail() : null,
                assignedManagerIds,
                assignedManagerNames,
                assignedManagerEmails);
    }
}
