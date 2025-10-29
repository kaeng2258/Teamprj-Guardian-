package com.ll.guardian.domain.notification.dto;

import jakarta.validation.constraints.NotNull;

public record NotificationRetryRequest(@NotNull(message = "알림 ID를 입력해주세요.") Long notificationId) {}
