package com.ll.guardian.domain.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DeviceTokenRequest(
        @NotNull(message = "사용자 ID를 입력해주세요.") Long userId,
        @NotBlank(message = "디바이스 토큰을 입력해주세요.") String token,
        String deviceOs) {}
