package com.ll.guardian.domain.notification.repository;

import com.ll.guardian.domain.notification.entity.Notification;
import com.ll.guardian.domain.notification.NotificationStatus;
import com.ll.guardian.domain.notification.NotificationType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);

    List<Notification> findByTypeAndStatus(NotificationType type, NotificationStatus status);

    void deleteByRecipient_Id(Long userId);

}
