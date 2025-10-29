package com.ll.guardian.domain.alarm.repository;

import com.ll.guardian.domain.alarm.entity.AlarmOccurrence;
import com.ll.guardian.domain.alarm.AlarmOccurrenceStatus;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AlarmOccurrenceRepository extends JpaRepository<AlarmOccurrence, Long> {

    List<AlarmOccurrence> findByAlarmId(Long alarmId);

    List<AlarmOccurrence> findByStatusAndScheduledTimeBefore(AlarmOccurrenceStatus status, LocalDateTime scheduledTime);
}
