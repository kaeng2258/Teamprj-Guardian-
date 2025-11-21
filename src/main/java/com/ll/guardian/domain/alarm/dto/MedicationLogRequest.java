package com.ll.guardian.domain.alarm.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record MedicationLogRequest(
        Long planId,
        @NotNull(message = "약품 ID를 입력해주세요.") Long medicineId,
        @NotNull(message = "복약 시간 정보를 입력해주세요.") LocalDateTime logTimestamp,
        String notes) {}
