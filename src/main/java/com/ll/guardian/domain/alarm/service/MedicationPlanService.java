package com.ll.guardian.domain.alarm.service;

import com.ll.guardian.domain.alarm.dto.MedicationPlanRequest;
import com.ll.guardian.domain.alarm.dto.MedicationPlanResponse;
import com.ll.guardian.domain.alarm.dto.MedicationPlanUpdateRequest;
import com.ll.guardian.domain.alarm.entity.MedicationAlarm;
import com.ll.guardian.domain.alarm.repository.MedicationAlarmRepository;
import com.ll.guardian.domain.medicine.entity.Medicine;
import com.ll.guardian.domain.medicine.repository.MedicineRepository;
import com.ll.guardian.domain.user.entity.User;
import com.ll.guardian.domain.user.repository.UserRepository;
import com.ll.guardian.global.exception.GuardianException;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class MedicationPlanService {

    private final MedicationAlarmRepository medicationAlarmRepository;
    private final UserRepository userRepository;
    private final MedicineRepository medicineRepository;

    public MedicationPlanService(
            MedicationAlarmRepository medicationAlarmRepository,
            UserRepository userRepository,
            MedicineRepository medicineRepository) {
        this.medicationAlarmRepository = medicationAlarmRepository;
        this.userRepository = userRepository;
        this.medicineRepository = medicineRepository;
    }

    public MedicationPlanResponse createPlan(Long clientId, MedicationPlanRequest request) {
        User client = getUser(clientId);
        Medicine medicine = getMedicine(request.medicineId());
        String daysOfWeek = String.join(",", request.daysOfWeek());

        MedicationAlarm alarm = MedicationAlarm.builder()
                .client(client)
                .medicine(medicine)
                .dosageAmount(request.dosageAmount())
                .dosageUnit(request.dosageUnit())
                .alarmTime(request.alarmTime())
                .daysOfWeek(daysOfWeek)
                .active(true)
                .build();

        MedicationAlarm saved = medicationAlarmRepository.save(alarm);
        return MedicationPlanResponse.from(saved);
    }

    public MedicationPlanResponse updatePlan(Long clientId, Long alarmId, MedicationPlanUpdateRequest request) {
        MedicationAlarm alarm = medicationAlarmRepository
                .findByIdAndClient_Id(alarmId, clientId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "알람 정보를 찾을 수 없습니다."));
        alarm.updatePlan(
                request.dosageAmount(),
                request.dosageUnit(),
                request.alarmTime(),
                String.join(",", request.daysOfWeek()),
                request.active());
        return MedicationPlanResponse.from(alarm);
    }

    public void deletePlan(Long clientId, Long alarmId) {
        MedicationAlarm alarm = medicationAlarmRepository
                .findByIdAndClient_Id(alarmId, clientId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "알람 정보를 찾을 수 없습니다."));
        medicationAlarmRepository.delete(alarm);
    }

    @Transactional(readOnly = true)
    public List<MedicationPlanResponse> getPlans(Long clientId) {
        return medicationAlarmRepository.findByClient_Id(clientId).stream()
                .map(MedicationPlanResponse::from)
                .collect(Collectors.toList());
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
}
