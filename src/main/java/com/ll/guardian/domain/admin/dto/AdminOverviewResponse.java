package com.ll.guardian.domain.admin.dto;

import com.ll.guardian.domain.emergency.entity.EmergencyAlert;
import com.ll.guardian.domain.notification.entity.Notification;

import java.util.List;

public record AdminOverviewResponse(
        long clientCount,
        long managerCount,
        long activeMatches,
        List<EmergencyAlertSummary> recentAlerts,
        List<NotificationSummary> recentNotifications
) {

    public static AdminOverviewResponse from(
            long clientCount,
            long managerCount,
            long activeMatches,
            List<EmergencyAlert> alerts,
            List<Notification> notifications
    ) {
        List<EmergencyAlertSummary> alertSummaries = alerts.stream()
                .map(EmergencyAlertSummary::from)
                .toList();

        List<NotificationSummary> notificationSummaries = notifications.stream()
                .map(NotificationSummary::from)
                .toList();

        return new AdminOverviewResponse(
                clientCount,
                managerCount,
                activeMatches,
                alertSummaries,
                notificationSummaries
        );
    }
}