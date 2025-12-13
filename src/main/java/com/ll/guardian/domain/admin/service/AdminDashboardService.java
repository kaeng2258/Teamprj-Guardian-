package com.ll.guardian.domain.admin.service;

import com.ll.guardian.domain.admin.dto.AdminMedicationPlanSummary;
import com.ll.guardian.domain.admin.dto.AdminMedicationSummaryResponse;
import com.ll.guardian.domain.admin.dto.MedicationAdherenceResponse;
import com.ll.guardian.domain.alarm.entity.MedicationAlarm;
import com.ll.guardian.domain.alarm.repository.AlarmOccurrenceRepository;
import com.ll.guardian.domain.alarm.repository.MedicationAlarmRepository;
import com.ll.guardian.domain.alarm.repository.MedicationLogRepository;
import com.ll.guardian.domain.chat.repository.ChatMessageRepository;
import com.ll.guardian.domain.chat.repository.ChatRoomRepository;
import com.ll.guardian.domain.emergency.EmergencyAlertStatus;
import com.ll.guardian.domain.emergency.repository.EmergencyAlertRepository;
import com.ll.guardian.domain.matching.entity.CareMatch;
import com.ll.guardian.domain.matching.repository.CareMatchRepository;
import com.ll.guardian.domain.notification.entity.Notification;
import com.ll.guardian.domain.notification.repository.NotificationRepository;
import com.ll.guardian.domain.notification.repository.DeviceTokenRepository;
import com.ll.guardian.domain.notification.repository.WebPushSubscriptionRepository;
import com.ll.guardian.domain.user.UserRole;
import com.ll.guardian.domain.user.entity.User;
import com.ll.guardian.domain.user.repository.UserRepository;
import com.ll.guardian.domain.profile.repository.ClientProfileRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
    private final AlarmOccurrenceRepository alarmOccurrenceRepository;
    private final EmergencyAlertRepository emergencyAlertRepository;
    private final NotificationRepository notificationRepository;

    private final DeviceTokenRepository deviceTokenRepository;
    private final WebPushSubscriptionRepository webPushSubscriptionRepository;

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;

    private final ClientProfileRepository clientProfileRepository;

    public AdminDashboardService(
        UserRepository userRepository,
        CareMatchRepository careMatchRepository,
        MedicationAlarmRepository medicationAlarmRepository,
        MedicationLogRepository medicationLogRepository,
        AlarmOccurrenceRepository alarmOccurrenceRepository,
        EmergencyAlertRepository emergencyAlertRepository,
        NotificationRepository notificationRepository,
        DeviceTokenRepository deviceTokenRepository,
        WebPushSubscriptionRepository webPushSubscriptionRepository,
        ChatRoomRepository chatRoomRepository,
        ChatMessageRepository chatMessageRepository,
        ClientProfileRepository clientProfileRepository
    ) {
        this.userRepository = userRepository;
        this.careMatchRepository = careMatchRepository;
        this.medicationAlarmRepository = medicationAlarmRepository;
        this.medicationLogRepository = medicationLogRepository;
        this.alarmOccurrenceRepository = alarmOccurrenceRepository;
        this.emergencyAlertRepository = emergencyAlertRepository;
        this.notificationRepository = notificationRepository;
        this.deviceTokenRepository = deviceTokenRepository;
        this.webPushSubscriptionRepository = webPushSubscriptionRepository;
        this.chatRoomRepository = chatRoomRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.clientProfileRepository = clientProfileRepository;
    }

    public Map<String, Object> getOverview() {
        Map<String, Object> result = new HashMap<>();
        result.put("clientCount", userRepository.countByRole(UserRole.CLIENT));
        result.put("managerCount", userRepository.countByRole(UserRole.MANAGER));
        result.put("activeMatches", careMatchRepository.findAll().stream().filter(CareMatch::isCurrent).count());
        result.put("recentAlerts", emergencyAlertRepository.findByStatus(EmergencyAlertStatus.PENDING));
        result.put("recentNotifications", notificationRepository.findAll().stream().limit(20).toList());
        return result;
    }

    public List<User> searchUsers(String keyword, UserRole role) {
        String kw = (keyword == null) ? "" : keyword;
        return userRepository.findAll().stream()
            .filter(user -> role == null || user.getRole() == role)
            .filter(user -> (user.getName() != null && user.getName().contains(kw))
                || (user.getEmail() != null && user.getEmail().contains(kw)))
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
        if (days <= 0) return 0.0;

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
        double adherence = days > 0
            ? Math.min(100d, Math.round((logs / (double) days) * 1000d) / 10d)
            : 0d;

        return new AdminMedicationSummaryResponse(adherence, plans);
    }

    /**
     * 유저 삭제:
     * - FK 제약 때문에 "User 먼저 삭제"는 거의 항상 실패합니다.
     * - 반드시 하위(연관) 데이터를 먼저 정리한 뒤 User를 삭제합니다.
     */
    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다. id=" + id));

        // 1) Notification (recipient FK)
        // deleteByRecipient_Id 메서드가 없으면 Repository에 추가 필요
        notificationRepository.deleteByRecipient_Id(id);

        // 2) EmergencyAlert (client / resolvedBy FK)
        // deleteByClient_IdOrResolvedBy_Id 메서드가 없으면 Repository에 추가 필요
        emergencyAlertRepository.deleteByClient_IdOrResolvedBy_Id(id, id);

        // 3) ChatRoom / Message 정리 (채팅 기능이 있다면 FK가 거의 항상 존재)
        // 아래 repo가 없다면(채팅이 다른 구조면) 해당 블록 제거/대체 필요
        var rooms = chatRoomRepository.findByClient_IdOrManager_Id(id, id);
        for (var room : rooms) {
            chatMessageRepository.deleteByRoomId(room.getId());
        }
        chatRoomRepository.deleteAll(rooms);

        // 4) Matching 정리
        var matches = careMatchRepository.findByClient_IdOrManager_Id(id, id);
        careMatchRepository.deleteAll(matches);

        // 5) 투약 로그/알람 정리
        // MedicationLogRepository에 deleteByClient_Id, deleteByAlarm_Id가 있어야 함
        medicationLogRepository.deleteByClient_Id(id);

        var alarms = medicationAlarmRepository.findByClient_Id(id);
        for (var alarm : alarms) {
            medicationLogRepository.deleteByAlarm_Id(alarm.getId());
            alarmOccurrenceRepository.deleteByAlarm_Id(alarm.getId());
        }
        medicationAlarmRepository.deleteAll(alarms);

        // 6) ClientProfile 정리 (있다면)
        clientProfileRepository.findByClientId(id).ifPresent(clientProfileRepository::delete);

        // 마지막: User 삭제
        userRepository.delete(user);
    }

}
