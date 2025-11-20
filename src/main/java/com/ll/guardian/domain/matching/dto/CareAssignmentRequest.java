package com.ll.guardian.domain.matching.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record CareAssignmentRequest(
        @NotNull(message = "클라이언트 ID를 입력해주세요.") Long clientId,
        @NotNull(message = "매니저 ID를 입력해주세요.") Long managerId,
        LocalDate startDate,
        LocalDate endDate) {}
