package com.ll.guardian.domain.emergency.repository;

import com.ll.guardian.domain.emergency.entity.EmergencyAlert;
import com.ll.guardian.domain.emergency.EmergencyAlertStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmergencyAlertRepository extends JpaRepository<EmergencyAlert, Long> {

    List<EmergencyAlert> findByClientId(Long clientId);

    List<EmergencyAlert> findByStatus(EmergencyAlertStatus status);

    List<EmergencyAlert> findByResolvedBy_Id(Long userId);
    void deleteByClient_IdOrResolvedBy_Id(Long userId1, Long userId2);
}
