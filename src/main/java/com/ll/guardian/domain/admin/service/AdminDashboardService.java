package com.ll.guardian.domain.admin.service;

import com.ll.guardian.domain.admin.dto.AdminMedicationPlanSummary;
import com.ll.guardian.domain.admin.dto.AdminMedicationSummaryResponse;
import com.ll.guardian.domain.admin.dto.MedicationAdherenceResponse;
import com.ll.guardian.domain.alarm.entity.MedicationAlarm;
import com.ll.guardian.domain.alarm.repository.MedicationAlarmRepository;
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
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
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
    private final MedicationAlarmRepository medicationAlarmRepository;
    private final MedicationLogRepository medicationLogRepository;
    private final EmergencyAlertRepository emergencyAlertRepository;
    private final NotificationRepository notificationRepository;

    public AdminDashboardService(
            UserRepository userRepository,
            CareMatchRepository careMatchRepository,
            MedicationAlarmRepository medicationAlarmRepository,
            MedicationLogRepository medicationLogRepository,
            EmergencyAlertRepository emergencyAlertRepository,
            NotificationRepository notificationRepository) {
        this.userRepository = userRepository;
        this.careMatchRepository = careMatchRepository;
        this.medicationAlarmRepository = medicationAlarmRepository;
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

    public MedicationAdherenceResponse calculateMedicationAdherenceWithPoints(Integer months, LocalDate from, LocalDate to) {
        LocalDate endDate = (to != null) ? to : LocalDate.now();
        LocalDate startDate;

        if (months != null && months > 0) {
            startDate = endDate.minusMonths(months - 1).withDayOfMonth(1);
        } else if (from != null) {
            startDate = from;
        } else {
            // 기본 6개월
            startDate = endDate.minusMonths(5).withDayOfMonth(1);
        }

        double overall = calculateMedicationAdherence(startDate, endDate);

        List<MedicationAdherenceResponse.MonthlyPoint> points = new ArrayList<>();
        LocalDate cursor = startDate.withDayOfMonth(1);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM");
        while (!cursor.isAfter(endDate.withDayOfMonth(1))) {
            LocalDate monthStart = cursor.withDayOfMonth(1);
            LocalDate monthEnd = cursor.withDayOfMonth(cursor.lengthOfMonth());
            double rate = calculateMedicationAdherence(monthStart, monthEnd);
            points.add(new MedicationAdherenceResponse.MonthlyPoint(fmt.format(monthStart), rate));
            cursor = cursor.plusMonths(1);
        }

        return new MedicationAdherenceResponse(startDate, endDate, overall, points);
    }

    public double calculateMedicationAdherence(LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.plusDays(1).atStartOfDay();
        long days = ChronoUnit.DAYS.between(from, to) + 1;
        if (days <= 0) {
            return 0.0;
        }

        long logs = medicationLogRepository.countByLogTimestampBetween(start, end);
        double rate = (logs / (double) days) * 100d;
        return Math.min(100d, Math.round(rate * 10d) / 10d);
    }

    public List<Notification> getNotifications() {
        return notificationRepository.findAll();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다. id=" + id));
    }

    public AdminMedicationSummaryResponse getMedicationSummary(Long userId) {
        User user = getUserById(userId);
        if (user.getRole() != UserRole.CLIENT) {
            return AdminMedicationSummaryResponse.empty();
        }

        List<MedicationAlarm> alarms = medicationAlarmRepository.findByClient_Id(userId);
        List<AdminMedicationPlanSummary> plans = alarms.stream()
                .map(alarm -> new AdminMedicationPlanSummary(
                        alarm.getMedicine().getName(),
                        alarm.getAlarmTime() != null ? alarm.getAlarmTime().toString() : null,
                        alarm.getDaysOfWeek() != null && !alarm.getDaysOfWeek().isBlank()
                                ? List.of(alarm.getDaysOfWeek().split(","))
                                : List.of()
                ))
                .toList();

        LocalDateTime end = LocalDate.now().plusDays(1).atStartOfDay();
        LocalDateTime start = end.minusDays(30);
        long days = 30;
        long logs = medicationLogRepository.countByClient_IdAndLogTimestampBetween(userId, start, end);
        double adherence = days > 0 ? Math.min(100d, Math.round((logs / (double) days) * 1000d) / 10d) : 0d;

        return new AdminMedicationSummaryResponse(adherence, plans);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다. id=" + id));
        userRepository.delete(user);
    }
}

