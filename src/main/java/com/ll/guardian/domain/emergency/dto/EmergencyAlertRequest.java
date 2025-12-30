package com.ll.guardian.domain.emergency.dto;

import com.ll.guardian.domain.emergency.EmergencyAlertType;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record EmergencyAlertRequest(
        @NotNull(message = "클라이언트 ID를 입력해주세요.") Long clientId,
        @NotNull(message = "알림 유형을 입력해주세요.") EmergencyAlertType alertType,
        Long managerId,
        boolean shareLocation,
        Double latitude,
        Double longitude,
        LocalDateTime alertTime) {}
