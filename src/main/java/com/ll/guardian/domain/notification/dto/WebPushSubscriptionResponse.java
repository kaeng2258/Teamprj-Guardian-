package com.ll.guardian.domain.notification.dto;

import com.ll.guardian.domain.notification.entity.WebPushSubscription;
import java.time.LocalDateTime;

public record WebPushSubscriptionResponse(
        Long id,
        String endpoint,
        Long expirationTime,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime lastUsedAt) {

    public static WebPushSubscriptionResponse from(WebPushSubscription subscription) {
        return new WebPushSubscriptionResponse(
                subscription.getId(),
                subscription.getEndpoint(),
                subscription.getExpirationTime(),
                subscription.getCreatedAt(),
                subscription.getUpdatedAt(),
                subscription.getLastUsedAt());
    }
}
