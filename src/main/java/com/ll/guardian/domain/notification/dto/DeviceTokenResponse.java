package com.ll.guardian.domain.notification.dto;

import com.ll.guardian.domain.notification.entity.DeviceToken;
import java.time.LocalDateTime;

public record DeviceTokenResponse(
        Long tokenId,
        Long userId,
        String token,
        String deviceOs,
        boolean active,
        LocalDateTime lastUsedAt,
        LocalDateTime createdAt) {

    public static DeviceTokenResponse from(DeviceToken deviceToken) {
        return new DeviceTokenResponse(
                deviceToken.getId(),
                deviceToken.getUser().getId(),
                deviceToken.getToken(),
                deviceToken.getDeviceOs(),
                deviceToken.isActive(),
                deviceToken.getLastUsedAt(),
                deviceToken.getCreatedAt());
    }
}
