package com.ll.guardian.domain.notification.dto;

import com.ll.guardian.domain.notification.NotificationStatus;
import com.ll.guardian.domain.notification.NotificationType;
import com.ll.guardian.domain.notification.entity.Notification;
import java.time.LocalDateTime;

public record NotificationResponse(
        Long notificationId,
        Long recipientId,
        NotificationType type,
        String title,
        String message,
        NotificationStatus status,
        LocalDateTime createdAt,
        String failReason) {

    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getRecipient().getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getStatus(),
                notification.getCreatedAt(),
                notification.getFailReason());
    }
}
