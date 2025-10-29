package com.ll.guardian.domain.notification.service;

import com.ll.guardian.domain.notification.NotificationStatus;
import com.ll.guardian.domain.notification.NotificationType;
import com.ll.guardian.domain.notification.dto.NotificationResponse;
import com.ll.guardian.domain.notification.dto.NotificationRetryRequest;
import com.ll.guardian.domain.notification.dto.NotificationSearchRequest;
import com.ll.guardian.domain.notification.entity.Notification;
import com.ll.guardian.domain.notification.repository.NotificationRepository;
import com.ll.guardian.domain.user.entity.User;
import com.ll.guardian.domain.user.repository.UserRepository;
import com.ll.guardian.global.exception.GuardianException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> search(NotificationSearchRequest request) {
        List<Notification> notifications;
        if (request.recipientId() != null) {
            notifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(request.recipientId());
        } else if (request.type() != null && request.status() != null) {
            notifications = notificationRepository.findByTypeAndStatus(request.type(), request.status());
        } else {
            notifications = notificationRepository.findAll();
        }

        return notifications.stream()
                .filter(notification -> filterByDate(notification, request.from(), request.to()))
                .map(NotificationResponse::from)
                .collect(Collectors.toList());
    }

    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository
                .findById(notificationId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "알림을 찾을 수 없습니다."));
        notification.markAsRead();
    }

    public NotificationResponse retry(NotificationRetryRequest request) {
        Notification notification = notificationRepository
                .findById(request.notificationId())
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "알림을 찾을 수 없습니다."));
        notification.markStatus(NotificationStatus.PENDING, null);
        return NotificationResponse.from(notification);
    }

    public NotificationResponse sendNotification(
            Long recipientId, NotificationType type, String title, String message, String payload, Long relatedId) {
        User recipient = userRepository
                .findById(recipientId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "수신자를 찾을 수 없습니다."));

        Notification notification = Notification.builder()
                .recipient(recipient)
                .type(type)
                .title(title)
                .message(message)
                .payload(payload)
                .relatedId(relatedId)
                .status(NotificationStatus.PENDING)
                .read(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        return NotificationResponse.from(saved);
    }

    private boolean filterByDate(Notification notification, LocalDateTime from, LocalDateTime to) {
        if (from != null && notification.getCreatedAt().isBefore(from)) {
            return false;
        }
        if (to != null && notification.getCreatedAt().isAfter(to)) {
            return false;
        }
        return true;
    }
}
