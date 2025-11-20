package com.ll.guardian.domain.admin.service;

import com.ll.guardian.domain.alarm.repository.MedicationLogRepository;
import com.ll.guardian.domain.emergency.repository.EmergencyAlertRepository;
import com.ll.guardian.domain.matching.entity.CareMatch;
import com.ll.guardian.domain.matching.repository.CareMatchRepository;
import com.ll.guardian.domain.notification.entity.Notification;
import com.ll.guardian.domain.notification.repository.NotificationRepository;
import com.ll.guardian.domain.user.UserRole;
import com.ll.guardian.domain.user.entity.User;
import com.ll.guardian.domain.user.repository.UserRepository;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AdminDashboardService {

    private final UserRepository userRepository;
    private final CareMatchRepository careMatchRepository;
    private final MedicationLogRepository medicationLogRepository;
    private final EmergencyAlertRepository emergencyAlertRepository;
    private final NotificationRepository notificationRepository;

    public AdminDashboardService(
            UserRepository userRepository,
            CareMatchRepository careMatchRepository,
            MedicationLogRepository medicationLogRepository,
            EmergencyAlertRepository emergencyAlertRepository,
            NotificationRepository notificationRepository) {
        this.userRepository = userRepository;
        this.careMatchRepository = careMatchRepository;
        this.medicationLogRepository = medicationLogRepository;
        this.emergencyAlertRepository = emergencyAlertRepository;
        this.notificationRepository = notificationRepository;
    }

    public Map<String, Object> getOverview() {
        Map<String, Object> result = new HashMap<>();
        result.put("clientCount", userRepository.countByRole(UserRole.CLIENT));
        result.put("managerCount", userRepository.countByRole(UserRole.MANAGER));
        result.put("activeMatches", careMatchRepository.findAll().stream().filter(CareMatch::isCurrent).count());
        result.put("recentAlerts", emergencyAlertRepository.findByStatus(
                com.ll.guardian.domain.emergency.EmergencyAlertStatus.PENDING));
        result.put("recentNotifications", notificationRepository.findAll().stream().limit(20).toList());
        return result;
    }

    public List<User> searchUsers(String keyword, UserRole role) {
        return userRepository.findAll().stream()
                .filter(user -> role == null || user.getRole() == role)
                .filter(user -> user.getName().contains(keyword) || user.getEmail().contains(keyword))
                .toList();
    }

    public double calculateMedicationAdherence(LocalDate from, LocalDate to) {
        long totalLogs = medicationLogRepository.count();
        if (totalLogs == 0) {
            return 0.0;
        }
        long takenLogs = medicationLogRepository.findAll().stream()
                .filter(log -> !log.getLogTimestamp().isBefore(from.atStartOfDay())
                        && !log.getLogTimestamp().isAfter(to.plusDays(1).atStartOfDay()))
                .count();
        return Math.round((takenLogs / (double) totalLogs) * 1000d) / 10d;
    }

    public List<Notification> getNotifications() {
        return notificationRepository.findAll();
    }
}
