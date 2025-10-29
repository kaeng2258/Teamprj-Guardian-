package com.ll.guardian.domain.alarm.dto;

import com.ll.guardian.domain.alarm.AlarmOccurrenceStatus;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record AlarmOccurrenceUpdateRequest(
        @NotNull(message = "상태를 입력해주세요.") AlarmOccurrenceStatus status,
        LocalDateTime actualResponseTime,
        String providerNotes) {}
