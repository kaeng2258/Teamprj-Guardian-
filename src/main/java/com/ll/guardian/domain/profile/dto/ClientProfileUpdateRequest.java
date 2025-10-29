package com.ll.guardian.domain.profile.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ClientProfileUpdateRequest(
        @NotBlank(message = "주소를 입력해주세요.") String address,
        @NotNull(message = "나이를 입력해주세요.") Integer age,
        String medicalNotes,
        @NotBlank(message = "복약 주기를 입력해주세요.") String medicationCycle) {}
