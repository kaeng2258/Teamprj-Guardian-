package com.ll.guardian.domain.alarm.service;

import com.ll.guardian.domain.alarm.dto.AlarmOccurrenceResponse;
import com.ll.guardian.domain.alarm.dto.AlarmOccurrenceUpdateRequest;
import com.ll.guardian.domain.alarm.entity.AlarmOccurrence;
import com.ll.guardian.domain.alarm.repository.AlarmOccurrenceRepository;
import com.ll.guardian.global.exception.GuardianException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AlarmOccurrenceService {

    private final AlarmOccurrenceRepository alarmOccurrenceRepository;

    public AlarmOccurrenceService(AlarmOccurrenceRepository alarmOccurrenceRepository) {
        this.alarmOccurrenceRepository = alarmOccurrenceRepository;
    }

    @Transactional(readOnly = true)
    public List<AlarmOccurrenceResponse> findByAlarm(Long alarmId) {
        return alarmOccurrenceRepository.findByAlarmId(alarmId).stream()
                .map(AlarmOccurrenceResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AlarmOccurrenceResponse> findOverdue(LocalDateTime before) {
        return alarmOccurrenceRepository
                .findByStatusAndScheduledTimeBefore(
                        com.ll.guardian.domain.alarm.AlarmOccurrenceStatus.SCHEDULED, before)
                .stream()
                .map(AlarmOccurrenceResponse::from)
                .collect(Collectors.toList());
    }

    public AlarmOccurrenceResponse updateStatus(Long occurrenceId, AlarmOccurrenceUpdateRequest request) {
        AlarmOccurrence occurrence = alarmOccurrenceRepository
                .findById(occurrenceId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "알람 발생 이력을 찾을 수 없습니다."));
        occurrence.updateStatus(request.status(), request.actualResponseTime(), request.providerNotes());
        return AlarmOccurrenceResponse.from(occurrence);
    }
}
