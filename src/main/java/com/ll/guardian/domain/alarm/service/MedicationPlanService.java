package com.ll.guardian.domain.alarm.service;

import com.ll.guardian.domain.alarm.dto.ManualMedicineRequest;
import com.ll.guardian.domain.alarm.dto.MedicationPlanBatchItemRequest;
import com.ll.guardian.domain.alarm.dto.MedicationPlanBatchRequest;
import com.ll.guardian.domain.alarm.dto.MedicationPlanRequest;
import com.ll.guardian.domain.alarm.dto.MedicationPlanResponse;
import com.ll.guardian.domain.alarm.dto.MedicationPlanUpdateRequest;
import com.ll.guardian.domain.alarm.entity.MedicationAlarm;
import com.ll.guardian.domain.alarm.repository.AlarmOccurrenceRepository;
import com.ll.guardian.domain.alarm.repository.MedicationAlarmRepository;
import com.ll.guardian.domain.alarm.repository.MedicationLogRepository;
import com.ll.guardian.domain.chat.MessageType;
import com.ll.guardian.domain.chat.dto.ChatMessageRequest;
import com.ll.guardian.domain.chat.service.ChatService;
import com.ll.guardian.domain.matching.entity.CareMatch;
import com.ll.guardian.domain.matching.repository.CareMatchRepository;
import com.ll.guardian.domain.medicine.entity.Medicine;
import com.ll.guardian.domain.medicine.repository.MedicineRepository;
import com.ll.guardian.domain.user.entity.User;
import com.ll.guardian.domain.user.repository.UserRepository;
import com.ll.guardian.global.exception.GuardianException;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@Transactional
public class MedicationPlanService {

    private final MedicationAlarmRepository medicationAlarmRepository;
    private final MedicationLogRepository medicationLogRepository;
    private final AlarmOccurrenceRepository alarmOccurrenceRepository;
    private final CareMatchRepository careMatchRepository;
    private final UserRepository userRepository;
    private final MedicineRepository medicineRepository;
    private final ChatService chatService;

    public MedicationPlanService(
            MedicationAlarmRepository medicationAlarmRepository,
            MedicationLogRepository medicationLogRepository,
            AlarmOccurrenceRepository alarmOccurrenceRepository,
            CareMatchRepository careMatchRepository,
            UserRepository userRepository,
            MedicineRepository medicineRepository,
            ChatService chatService) {
        this.medicationAlarmRepository = medicationAlarmRepository;
        this.medicationLogRepository = medicationLogRepository;
        this.alarmOccurrenceRepository = alarmOccurrenceRepository;
        this.careMatchRepository = careMatchRepository;
        this.userRepository = userRepository;
        this.medicineRepository = medicineRepository;
        this.chatService = chatService;
    }

    public MedicationPlanResponse createPlan(Long clientId, MedicationPlanRequest request) {
        User client = getUser(clientId);
        Medicine medicine = resolveMedicine(request);
        String daysOfWeek = normalizeDaysOfWeek(request.daysOfWeek());

        MedicationAlarm alarm = createMedicationAlarm(
                client, medicine, request.dosageAmount(), request.dosageUnit(), request.alarmTime(), daysOfWeek);
        MedicationAlarm saved = medicationAlarmRepository.save(alarm);
        List<CareMatch> matches = findCurrentMatches(clientId);
        notifyManagersPlanCreated(matches, client, saved.getMedicine().getName(), saved.getAlarmTime());
        return MedicationPlanResponse.from(saved, matches);
    }

    public List<MedicationPlanResponse> createPlans(Long clientId, MedicationPlanBatchRequest request) {
        User client = getUser(clientId);
        String daysOfWeek = normalizeDaysOfWeek(request.daysOfWeek());
        List<CareMatch> matches = findCurrentMatches(clientId);

        List<MedicationAlarm> saved = request.items().stream()
                .map(item -> {
                    Medicine medicine = resolveMedicine(item);
                    MedicationAlarm alarm = createMedicationAlarm(
                            client, medicine, item.dosageAmount(), item.dosageUnit(), request.alarmTime(), daysOfWeek);
                    return medicationAlarmRepository.save(alarm);
                })
                .toList();

        if (!saved.isEmpty()) {
            notifyManagersBatchPlansCreated(matches, client, saved.size(), saved.get(0).getAlarmTime());
        }

        return saved.stream()
                .map(alarm -> MedicationPlanResponse.from(alarm, matches))
                .collect(Collectors.toList());
    }

    public MedicationPlanResponse updatePlan(Long clientId, Long alarmId, MedicationPlanUpdateRequest request) {
        MedicationAlarm alarm = medicationAlarmRepository
                .findByIdAndClient_Id(alarmId, clientId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "알람 정보를 찾을 수 없습니다."));
        alarm.updatePlan(
                request.dosageAmount(),
                request.dosageUnit(),
                request.alarmTime(),
                normalizeDaysOfWeek(request.daysOfWeek()),
                request.active());
        List<CareMatch> matches = findCurrentMatches(clientId);
        return MedicationPlanResponse.from(alarm, matches);
    }

    public void deletePlan(Long clientId, Long alarmId) {
        MedicationAlarm alarm = medicationAlarmRepository
                .findByIdAndClient_Id(alarmId, clientId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "알람 정보를 찾을 수 없습니다."));
        // 알람과 연관된 복약 기록 제거 (FK 제약 대비)
        medicationLogRepository.deleteByAlarm_Id(alarmId);
        alarmOccurrenceRepository.deleteByAlarm_Id(alarmId);
        medicationAlarmRepository.delete(alarm);
    }

    @Transactional(readOnly = true)
    public List<MedicationPlanResponse> getPlans(Long clientId) {
        List<CareMatch> matches = findCurrentMatches(clientId);
        return medicationAlarmRepository.findByClient_Id(clientId).stream()
                .map(alarm -> MedicationPlanResponse.from(alarm, matches))
                .collect(Collectors.toList());
    }

    private User getUser(Long clientId) {
        return userRepository
                .findById(clientId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
    }

    private Medicine resolveMedicine(MedicationPlanRequest request) {
        return resolveMedicine(request.medicineId(), request.manualMedicine());
    }

    private Medicine resolveMedicine(MedicationPlanBatchItemRequest item) {
        return resolveMedicine(item.medicineId(), item.manualMedicine());
    }

    private List<CareMatch> findCurrentMatches(Long clientId) {
        return careMatchRepository.findByClientIdInAndCurrentTrue(List.of(clientId));
    }

    private void notifyManagersPlanCreated(List<CareMatch> matches, User client, String medicineName, LocalTime alarmTime) {
        if (matches == null || matches.isEmpty()) {
            return;
        }
        String name = StringUtils.hasText(medicineName) ? medicineName : "약품";
        String timeText = alarmTime != null ? alarmTime.toString() : "미지정";
        String content = String.format("%s님의 복용 일정이 등록되었습니다. %s / 알람 %s", client.getName(), name, timeText);

        matches.stream()
                .map(CareMatch::getManager)
                .filter(Objects::nonNull)
                .map(User::getId)
                .distinct()
                .forEach(managerId -> {
                    Long roomId = chatService.openOrGetRoom(client.getId(), managerId).getId();
                    chatService.sendMessage(new ChatMessageRequest(
                            roomId,
                            client.getId(),
                            content,
                            MessageType.NOTICE,
                            null
                    ));
                });
    }

    private void notifyManagersBatchPlansCreated(List<CareMatch> matches, User client, int count, LocalTime alarmTime) {
        if (matches == null || matches.isEmpty()) {
            return;
        }
        String timeText = alarmTime != null ? alarmTime.toString() : "미지정";
        String content = String.format(
                "%s님의 복용 일정 %d건이 등록되었습니다. 알람 %s",
                client.getName(),
                count,
                timeText
        );

        matches.stream()
                .map(CareMatch::getManager)
                .filter(Objects::nonNull)
                .map(User::getId)
                .distinct()
                .forEach(managerId -> {
                    Long roomId = chatService.openOrGetRoom(client.getId(), managerId).getId();
                    chatService.sendMessage(new ChatMessageRequest(
                            roomId,
                            client.getId(),
                            content,
                            MessageType.NOTICE,
                            null
                    ));
                });
    }

    private Medicine resolveMedicine(Long medicineId, ManualMedicineRequest manual) {
        if (medicineId != null) {
            return getMedicine(medicineId);
        }

        if (manual == null) {
            throw new GuardianException(HttpStatus.BAD_REQUEST, "약품 정보를 입력해주세요.");
        }
        return createMedicineFromManual(manual);
    }

    private Medicine createMedicineFromManual(ManualMedicineRequest manual) {
        if (StringUtils.hasText(manual.productCode())) {
            String productCode = manual.productCode().trim();
            return medicineRepository
                    .findByProductCode(productCode)
                    .orElseGet(() -> findOrCreateByName(manual));
        }
        return findOrCreateByName(manual);
    }

    private Medicine findOrCreateByName(ManualMedicineRequest manual) {
        if (manual == null || !StringUtils.hasText(manual.name())) {
            throw new GuardianException(HttpStatus.BAD_REQUEST, "약품 이름을 입력해주세요.");
        }
        String normalizedName = manual.name().trim();
        return medicineRepository
                .findByNameIgnoreCase(normalizedName)
                .orElseGet(() -> persistManualMedicine(manual));
    }

    private Medicine persistManualMedicine(ManualMedicineRequest manual) {
        String sanitizedName = manual.name().trim();
        Medicine medicine = Medicine.builder()
                .productCode(StringUtils.hasText(manual.productCode()) ? manual.productCode().trim() : null)
                .name(sanitizedName)
                .efficacy(manual.efficacy())
                .usageDosage(manual.usageDosage())
                .caution(manual.caution())
                .sideEffects(manual.sideEffects())
                .description(manual.description())
                .build();
        return medicineRepository.save(medicine);
    }

    private Medicine getMedicine(Long medicineId) {
        return medicineRepository
                .findById(medicineId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "약품 정보를 찾을 수 없습니다."));
    }

    /**
     * 요일 목록을 저장용 문자열로 변환한다.
     * - ALL이 포함되었거나 7일 모두 선택된 경우 "ALL"로 축약하여 days_of_week 컬럼 길이를 넘지 않도록 한다.
     * - 입력 순서는 유지하고 중복은 제거한다.
     */
    private String normalizeDaysOfWeek(List<String> days) {
        if (days == null || days.isEmpty()) {
            throw new GuardianException(HttpStatus.BAD_REQUEST, "복용 요일을 선택해주세요.");
        }

        Set<String> normalized = new LinkedHashSet<>();
        for (String raw : days) {
            if (!StringUtils.hasText(raw)) {
                continue;
            }
            String token = raw.trim().toUpperCase();
            if ("ALL".equals(token)) {
                return "ALL";
            }
            normalized.add(token);
        }

        // 모든 요일이 선택된 경우 ALL로 축약
        Set<DayOfWeek> selected = normalized.stream()
                .map(token -> {
                    try {
                        return DayOfWeek.valueOf(token);
                    } catch (IllegalArgumentException e) {
                        return null;
                    }
                })
                .filter(day -> day != null)
                .collect(Collectors.toCollection(() -> EnumSet.noneOf(DayOfWeek.class)));

        if (selected.containsAll(EnumSet.allOf(DayOfWeek.class))) {
            return "ALL";
        }

        if (normalized.isEmpty()) {
            throw new GuardianException(HttpStatus.BAD_REQUEST, "복용 요일을 올바르게 입력해주세요.");
        }

        return String.join(",", normalized);
    }

    private MedicationAlarm createMedicationAlarm(
            User client,
            Medicine medicine,
            Integer dosageAmount,
            String dosageUnit,
            LocalTime alarmTime,
            String daysOfWeek) {
        String sanitizedUnit = dosageUnit != null ? dosageUnit.trim() : "";
        return MedicationAlarm.builder()
                .client(client)
                .medicine(medicine)
                .dosageAmount(dosageAmount)
                .dosageUnit(sanitizedUnit)
                .alarmTime(alarmTime)
                .daysOfWeek(daysOfWeek)
                .active(true)
                .build();
    }
}
