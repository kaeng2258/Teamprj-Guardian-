package com.ll.guardian.domain.alarm.repository;

import com.ll.guardian.domain.alarm.entity.MedicationAlarm;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MedicationAlarmRepository extends JpaRepository<MedicationAlarm, Long> {

    List<MedicationAlarm> findByClient_Id(Long clientId);

    Optional<MedicationAlarm> findByIdAndClient_Id(Long alarmId, Long clientId);
}
