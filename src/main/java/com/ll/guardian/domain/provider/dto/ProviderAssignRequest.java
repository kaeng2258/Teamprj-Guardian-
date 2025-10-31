package com.ll.guardian.domain.provider.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record ProviderAssignRequest(
        @NotNull(message = "클라이언트 ID를 입력해주세요.") Long clientId,
        LocalDate startDate,
        LocalDate endDate) {}
