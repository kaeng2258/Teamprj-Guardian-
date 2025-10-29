package com.ll.guardian.domain.emergency.dto;

import com.ll.guardian.domain.emergency.entity.EmergencyAlert;
import java.time.LocalDateTime;

public record EmergencyAlertResponse(
        Long alertId,
        Long clientId,
        String clientName,
        String alertType,
        String status,
        LocalDateTime alertTime,
        LocalDateTime resolvedAt,
        Double latitude,
        Double longitude,
        String memo) {

    public static EmergencyAlertResponse from(EmergencyAlert alert) {
        return new EmergencyAlertResponse(
                alert.getId(),
                alert.getClient().getId(),
                alert.getClient().getName(),
                alert.getAlertType().name(),
                alert.getStatus().name(),
                alert.getAlertTime(),
                alert.getResolvedAt(),
                alert.getLatitude(),
                alert.getLongitude(),
                alert.getMemo());
    }
}
