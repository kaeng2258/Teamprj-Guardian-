package com.ll.guardian.domain.admin.dto;

import com.ll.guardian.domain.notification.NotificationStatus;
import com.ll.guardian.domain.notification.NotificationType;
import com.ll.guardian.domain.notification.entity.Notification;

import java.time.LocalDateTime;

public record NotificationSummary(
        Long id,
        String recipientName,
        NotificationType type,
        String title,
        String message,
        boolean read,
        NotificationStatus status,
        LocalDateTime createdAt
) {

    public static NotificationSummary from(Notification notification) {
        String recipientName = notification.getRecipient() != null
                ? notification.getRecipient().getName()
                : null;

        return new NotificationSummary(
                notification.getId(),
                recipientName,
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.isRead(),
                notification.getStatus(),
                notification.getCreatedAt()
        );
    }
}