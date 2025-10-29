package com.ll.guardian.domain.alarm.service;

import com.ll.guardian.domain.alarm.dto.MedicationLogRequest;
import com.ll.guardian.domain.alarm.dto.MedicationLogResponse;
import com.ll.guardian.domain.alarm.entity.MedicationLog;
import com.ll.guardian.domain.alarm.repository.MedicationLogRepository;
import com.ll.guardian.domain.medicine.entity.Medicine;
import com.ll.guardian.domain.medicine.repository.MedicineRepository;
import com.ll.guardian.domain.user.entity.User;
import com.ll.guardian.domain.user.repository.UserRepository;
import com.ll.guardian.global.exception.GuardianException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class MedicationLogService {

    private final MedicationLogRepository medicationLogRepository;
    private final UserRepository userRepository;
    private final MedicineRepository medicineRepository;

    public MedicationLogService(
            MedicationLogRepository medicationLogRepository,
            UserRepository userRepository,
            MedicineRepository medicineRepository) {
        this.medicationLogRepository = medicationLogRepository;
        this.userRepository = userRepository;
        this.medicineRepository = medicineRepository;
    }

    public MedicationLogResponse record(Long clientId, MedicationLogRequest request) {
        User client = getUser(clientId);
        Medicine medicine = getMedicine(request.medicineId());

        MedicationLog log = MedicationLog.builder()
                .client(client)
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
        log.update(request.logTimestamp(), request.notes());
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
                .findByClientIdAndLogTimestampBetween(clientId, start, end)
                .stream()
                .map(MedicationLogResponse::from)
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
