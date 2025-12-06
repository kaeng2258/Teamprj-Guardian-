package com.ll.guardian.domain.alarm.service;

import com.ll.guardian.domain.alarm.dto.MedicationLogRequest;
import com.ll.guardian.domain.alarm.dto.MedicationLogResponse;
import com.ll.guardian.domain.alarm.dto.MedicationWeeklySummaryResponse;
import com.ll.guardian.domain.alarm.entity.MedicationAlarm;
import com.ll.guardian.domain.alarm.entity.MedicationLog;
import com.ll.guardian.domain.alarm.repository.MedicationAlarmRepository;
import com.ll.guardian.domain.alarm.repository.MedicationLogRepository;
import com.ll.guardian.domain.medicine.entity.Medicine;
import com.ll.guardian.domain.medicine.repository.MedicineRepository;
import com.ll.guardian.domain.user.entity.User;
import com.ll.guardian.domain.user.repository.UserRepository;
import com.ll.guardian.global.exception.GuardianException;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class MedicationLogService {

    private final MedicationLogRepository medicationLogRepository;
    private final MedicationAlarmRepository medicationAlarmRepository;
    private final UserRepository userRepository;
    private final MedicineRepository medicineRepository;

    public MedicationLogService(
            MedicationLogRepository medicationLogRepository,
            MedicationAlarmRepository medicationAlarmRepository,
            UserRepository userRepository,
            MedicineRepository medicineRepository) {
        this.medicationLogRepository = medicationLogRepository;
        this.medicationAlarmRepository = medicationAlarmRepository;
        this.userRepository = userRepository;
        this.medicineRepository = medicineRepository;
    }

    public MedicationLogResponse record(Long clientId, MedicationLogRequest request) {
        User client = getUser(clientId);
        MedicationAlarm alarm = resolveAlarm(clientId, request.planId());
        Medicine medicine = alarm != null ? alarm.getMedicine() : getMedicine(request.medicineId());

        MedicationLog log = MedicationLog.builder()
                .client(client)
                .alarm(alarm)
                .medicine(medicine)
                .logTimestamp(request.logTimestamp())
                .notes(request.notes())
                .build();

        MedicationLog saved = medicationLogRepository.save(log);
        return MedicationLogResponse.from(saved);
    }

    public MedicationLogResponse update(Long logId, MedicationLogRequest request) {
        MedicationLog log = medicationLogRepository
                .findById(logId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "복약 기록을 찾을 수 없습니다."));
        MedicationAlarm alarm = resolveAlarm(log.getClient().getId(), request.planId());
        Medicine medicine = alarm != null ? alarm.getMedicine() : getMedicine(request.medicineId());
        log.update(alarm, medicine, request.logTimestamp(), request.notes());
        return MedicationLogResponse.from(log);
    }

    public void delete(Long logId) {
        MedicationLog log = medicationLogRepository
                .findById(logId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "복약 기록을 찾을 수 없습니다."));
        medicationLogRepository.delete(log);
    }

    @Transactional(readOnly = true)
    public List<MedicationLogResponse> getLogs(Long clientId, LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.plusDays(1).atStartOfDay();
        return medicationLogRepository
                .findByClient_IdAndLogTimestampBetween(clientId, start, end)
                .stream()
                .map(MedicationLogResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MedicationWeeklySummaryResponse getWeeklySummary(Long clientId, LocalDate endDate) {
        LocalDate end = endDate != null ? endDate : LocalDate.now();
        LocalDate start = end.minusDays(6);

        List<MedicationAlarm> alarms = medicationAlarmRepository.findByClient_Id(clientId).stream()
                .filter(MedicationAlarm::isActive)
                .toList();

        LocalDateTime startDateTime = start.atStartOfDay();
        LocalDateTime endDateTime = end.plusDays(1).atStartOfDay();
        List<MedicationLog> logs = medicationLogRepository
                .findByClient_IdAndLogTimestampBetween(clientId, startDateTime, endDateTime);

        Map<Long, Set<DayOfWeek>> alarmDays = alarms.stream()
                .collect(Collectors.toMap(MedicationAlarm::getId, alarm -> parseDaysOfWeek(alarm.getDaysOfWeek())));
        Map<Long, Set<LocalDate>> planLogDates = new HashMap<>();
        Map<LocalDate, Integer> manualLogCounts = new HashMap<>();
        for (MedicationLog log : logs) {
            LocalDate logDate = log.getLogTimestamp().toLocalDate();
            if (logDate.isBefore(start) || logDate.isAfter(end)) {
                continue;
            }
            if (log.getAlarm() != null) {
                planLogDates
                        .computeIfAbsent(log.getAlarm().getId(), key -> new HashSet<>())
                        .add(logDate);
            } else {
                manualLogCounts.merge(logDate, 1, Integer::sum);
            }
        }

        List<MedicationWeeklySummaryResponse.DayStatus> dayStatuses = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate current = start.plusDays(i);
            DayOfWeek targetDay = current.getDayOfWeek();
            int scheduledCount = (int) alarms.stream()
                    .filter(alarm -> alarmDays.getOrDefault(alarm.getId(), Set.of()).contains(targetDay))
                    // 생성(등록)일 이전 날짜에는 스케줄로 잡지 않음
                    .filter(alarm -> {
                        LocalDate createdDate = alarm.getCreatedAt() != null
                                ? alarm.getCreatedAt().toLocalDate()
                                : current;
                        return !createdDate.isAfter(current);
                    })
                    .count();
            int takenCount = (int) alarms.stream()
                    .filter(alarm -> planLogDates.getOrDefault(alarm.getId(), Set.of()).contains(current))
                    .count();

            int manualLogs = manualLogCounts.getOrDefault(current, 0);
            MedicationWeeklySummaryResponse.Status status = resolveStatus(scheduledCount, takenCount, manualLogs);

            dayStatuses.add(new MedicationWeeklySummaryResponse.DayStatus(
                    current, scheduledCount, takenCount, manualLogs, status));
        }

        return new MedicationWeeklySummaryResponse(start, end, dayStatuses);
    }

    private User getUser(Long clientId) {
        return userRepository
                .findById(clientId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
    }

    private Medicine getMedicine(Long medicineId) {
        return medicineRepository
                .findById(medicineId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "약품 정보를 찾을 수 없습니다."));
    }

    private MedicationAlarm resolveAlarm(Long clientId, Long planId) {
        if (planId == null) {
            return null;
        }
        return medicationAlarmRepository
                .findByIdAndClient_Id(planId, clientId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "복약 일정 정보를 찾을 수 없습니다."));
    }

    private MedicationWeeklySummaryResponse.Status resolveStatus(int scheduled, int taken, int manualLogs) {
        if (scheduled == 0) {
            return manualLogs > 0 ? MedicationWeeklySummaryResponse.Status.COMPLETED
                    : MedicationWeeklySummaryResponse.Status.NO_SCHEDULE;
        }
        int effectiveTaken = Math.min(scheduled, taken + manualLogs);
        if (effectiveTaken == 0) {
            return MedicationWeeklySummaryResponse.Status.MISSED;
        }
        if (effectiveTaken >= scheduled) {
            return MedicationWeeklySummaryResponse.Status.COMPLETED;
        }
        return MedicationWeeklySummaryResponse.Status.PARTIAL;
    }

    private Set<DayOfWeek> parseDaysOfWeek(String days) {
        EnumSet<DayOfWeek> set = EnumSet.noneOf(DayOfWeek.class);
        if (days == null || days.isBlank()) {
            return set;
        }
        for (String raw : days.split(",")) {
            String token = raw.trim().toUpperCase();
            if (token.isEmpty()) {
                continue;
            }
            switch (token) {
                case "ALL" -> set.addAll(EnumSet.allOf(DayOfWeek.class));
                case "WEEKDAY" -> set.addAll(EnumSet.of(
                        DayOfWeek.MONDAY,
                        DayOfWeek.TUESDAY,
                        DayOfWeek.WEDNESDAY,
                        DayOfWeek.THURSDAY,
                        DayOfWeek.FRIDAY));
                case "WEEKEND" -> set.addAll(EnumSet.of(DayOfWeek.SATURDAY, DayOfWeek.SUNDAY));
                default -> {
                    try {
                        set.add(DayOfWeek.valueOf(token));
                    } catch (IllegalArgumentException ignored) {
                        // 무시: 잘못된 요일 문자열
                    }
                }
            }
        }
        return set;
    }
}
