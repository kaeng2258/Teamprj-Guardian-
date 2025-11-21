package com.ll.guardian.domain.alarm.dto;

import jakarta.validation.constraints.NotBlank;

public record ManualMedicineRequest(
        @NotBlank(message = "직접 입력할 약품 이름을 입력해주세요.") String name,
        String productCode,
        String efficacy,
        String usageDosage,
        String caution,
        String sideEffects,
        String description) {}
