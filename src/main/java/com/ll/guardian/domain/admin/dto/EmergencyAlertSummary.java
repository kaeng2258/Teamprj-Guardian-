package com.ll.guardian.domain.admin.dto;

import com.ll.guardian.domain.emergency.EmergencyAlertStatus;
import com.ll.guardian.domain.emergency.EmergencyAlertType;
import com.ll.guardian.domain.emergency.entity.EmergencyAlert;

import java.time.LocalDateTime;

public record EmergencyAlertSummary(
        Long id,
        String clientName,
        String managerName,
        EmergencyAlertType alertType,
        EmergencyAlertStatus status,
        LocalDateTime alertTime
) {

    public static EmergencyAlertSummary from(EmergencyAlert alert) {
        String clientName = alert.getClient() != null ? alert.getClient().getName() : null;
        String managerName = alert.getResolvedBy() != null
                ? alert.getResolvedBy().getName()
                : null;

        return new EmergencyAlertSummary(
                alert.getId(),
                clientName,
                managerName,
                alert.getAlertType(),
                alert.getStatus(),
                alert.getAlertTime()
        );
    }
}