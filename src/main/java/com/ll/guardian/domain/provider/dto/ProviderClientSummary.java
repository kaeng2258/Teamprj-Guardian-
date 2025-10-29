package com.ll.guardian.domain.provider.dto;

import com.ll.guardian.domain.alarm.dto.MedicationPlanResponse;
import com.ll.guardian.domain.alarm.dto.MedicationLogResponse;
import com.ll.guardian.domain.emergency.entity.EmergencyAlert;
import java.util.List;

public record ProviderClientSummary(
        Long clientId,
        String clientName,
        List<MedicationPlanResponse> medicationPlans,
        List<MedicationLogResponse> latestMedicationLogs,
        List<EmergencyAlertInfo> emergencyAlerts) {

    public record EmergencyAlertInfo(
            Long alertId,
            String alertType,
            String status,
            java.time.LocalDateTime alertTime) {

        public static EmergencyAlertInfo from(EmergencyAlert alert) {
            return new EmergencyAlertInfo(
                    alert.getId(),
                    alert.getAlertType().name(),
                    alert.getStatus().name(),
                    alert.getAlertTime());
        }
    }
}
