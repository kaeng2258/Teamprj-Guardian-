package com.ll.guardian.domain.manager.service;

import com.ll.guardian.domain.alarm.dto.MedicationLogResponse;
import com.ll.guardian.domain.alarm.dto.MedicationPlanResponse;
import com.ll.guardian.domain.alarm.repository.MedicationAlarmRepository;
import com.ll.guardian.domain.alarm.repository.MedicationLogRepository;
import com.ll.guardian.domain.emergency.EmergencyAlertStatus;
import com.ll.guardian.domain.emergency.entity.EmergencyAlert;
import com.ll.guardian.domain.emergency.repository.EmergencyAlertRepository;
import com.ll.guardian.domain.matching.entity.CareMatch;
import com.ll.guardian.domain.matching.repository.CareMatchRepository;
import com.ll.guardian.domain.manager.dto.ManagerClientSummary;
import com.ll.guardian.domain.manager.dto.ManagerDashboardResponse;
import com.ll.guardian.domain.user.entity.User;
import com.ll.guardian.domain.user.repository.UserRepository;
import com.ll.guardian.global.exception.GuardianException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ManagerDashboardService {

    private final UserRepository userRepository;
    private final CareMatchRepository careMatchRepository;
    private final MedicationAlarmRepository medicationAlarmRepository;
    private final MedicationLogRepository medicationLogRepository;
    private final EmergencyAlertRepository emergencyAlertRepository;

    public ManagerDashboardService(
            UserRepository userRepository,
            CareMatchRepository careMatchRepository,
            MedicationAlarmRepository medicationAlarmRepository,
            MedicationLogRepository medicationLogRepository,
            EmergencyAlertRepository emergencyAlertRepository) {
        this.userRepository = userRepository;
        this.careMatchRepository = careMatchRepository;
        this.medicationAlarmRepository = medicationAlarmRepository;
        this.medicationLogRepository = medicationLogRepository;
        this.emergencyAlertRepository = emergencyAlertRepository;
    }

    public ManagerDashboardResponse getDashboard(Long managerId) {
        User manager = userRepository
                .findById(managerId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "담당자를 찾을 수 없습니다."));

        List<CareMatch> matches = careMatchRepository.findByManagerId(managerId);
        Map<Long, List<MedicationPlanResponse>> planMap = matches.stream()
                .collect(Collectors.toMap(
                        match -> match.getClient().getId(),
                        match -> medicationAlarmRepository.findByClient_Id(match.getClient().getId()).stream()
                                .map(alarm -> MedicationPlanResponse.from(alarm, match))
                                .collect(Collectors.toList())));

        Map<Long, List<MedicationLogResponse>> logMap = matches.stream()
                .collect(Collectors.toMap(
                        match -> match.getClient().getId(),
                        match -> medicationLogRepository
                                .findByClient_IdAndLogTimestampBetween(
                                        match.getClient().getId(),
                                        LocalDate.now().minusDays(7).atStartOfDay(),
                                        LocalDate.now().plusDays(1).atStartOfDay())
                                .stream()
                                .map(MedicationLogResponse::from)
                                .collect(Collectors.toList())));

        Map<Long, List<EmergencyAlert>> emergencyMap = matches.stream()
                .collect(Collectors.toMap(
                        match -> match.getClient().getId(),
                        match -> emergencyAlertRepository.findByClientId(match.getClient().getId())));

        List<ManagerClientSummary> clients = matches.stream()
                .map(match -> new ManagerClientSummary(
                        match.getClient().getId(),
                        match.getClient().getName(),
                        planMap.getOrDefault(match.getClient().getId(), List.of()),
                        logMap.getOrDefault(match.getClient().getId(), List.of()),
                        emergencyMap.getOrDefault(match.getClient().getId(), List.of()).stream()
                                .map(ManagerClientSummary.EmergencyAlertInfo::from)
                                .toList()))
                .collect(Collectors.toList());

        long activeAlertCount = emergencyAlertRepository.findByStatus(EmergencyAlertStatus.PENDING).size();
        long pendingMedicationCount = matches.stream()
                .map(match -> medicationAlarmRepository.findByClient_Id(match.getClient().getId()).size())
                .mapToLong(Integer::longValue)
                .sum();

        return new ManagerDashboardResponse(manager.getId(), clients, activeAlertCount, pendingMedicationCount);
    }
}
