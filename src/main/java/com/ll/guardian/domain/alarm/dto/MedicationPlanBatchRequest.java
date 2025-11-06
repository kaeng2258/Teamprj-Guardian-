package com.ll.guardian.domain.alarm.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalTime;
import java.util.List;

public record MedicationPlanBatchRequest(
        @NotNull(message = "알람 시간을 입력해주세요.") LocalTime alarmTime,
        @NotNull(message = "복용 요일을 입력해주세요.")
                @Size(min = 1, message = "복용 요일을 최소 1개 이상 선택해주세요.")
                List<String> daysOfWeek,
        @Valid
                @NotNull(message = "약품 정보를 입력해주세요.")
                @Size(min = 1, message = "최소 1개 이상의 약품을 추가해주세요.")
                List<MedicationPlanBatchItemRequest> items) {}
