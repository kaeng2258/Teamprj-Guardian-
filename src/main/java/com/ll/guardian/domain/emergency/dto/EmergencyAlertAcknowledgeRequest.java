package com.ll.guardian.domain.emergency.dto;

import com.ll.guardian.domain.emergency.EmergencyAlertStatus;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record EmergencyAlertAcknowledgeRequest(
        @NotNull(message = "알림 ID를 입력해주세요.") Long alertId,
        @NotNull(message = "처리 상태를 입력해주세요.") EmergencyAlertStatus status,
        LocalDateTime resolvedAt,
        String memo) {}
