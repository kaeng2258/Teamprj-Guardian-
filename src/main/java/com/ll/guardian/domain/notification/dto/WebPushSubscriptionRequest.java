package com.ll.guardian.domain.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record WebPushSubscriptionRequest(
        @NotBlank(message = "endpoint를 전달해주세요.") String endpoint,
        Long expirationTime,
        @NotNull(message = "키 정보를 전달해주세요.") Keys keys,
        String userAgent) {

    public record Keys(
            @NotBlank(message = "auth 키가 필요합니다.") String auth,
            @NotBlank(message = "p256dh 키가 필요합니다.") String p256dh) {}
}
