package com.ll.guardian.domain.alarm.repository;

import com.ll.guardian.domain.alarm.entity.MedicationLog;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MedicationLogRepository extends JpaRepository<MedicationLog, Long> {

    List<MedicationLog> findByClient_IdAndLogTimestampBetween(Long clientId, LocalDateTime start, LocalDateTime end);

    boolean existsByAlarm_IdAndLogTimestampBetween(Long alarmId, LocalDateTime start, LocalDateTime end);
}
