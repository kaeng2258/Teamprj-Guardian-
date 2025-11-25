package com.ll.guardian.domain.notification.service;

import com.ll.guardian.domain.alarm.entity.MedicationAlarm;
import com.ll.guardian.domain.alarm.repository.MedicationAlarmRepository;
import com.ll.guardian.domain.alarm.repository.MedicationLogRepository;
import com.ll.guardian.domain.notification.entity.WebPushSubscription;
import com.ll.guardian.global.config.properties.WebPushProperties;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Component
@Slf4j
public class MedicationReminderScheduler {

    private final MedicationAlarmRepository medicationAlarmRepository;
    private final WebPushSubscriptionService subscriptionService;
    private final MedicationLogRepository medicationLogRepository;
    private final WebPushSender webPushSender;
    private final ZoneId zoneId;

    public MedicationReminderScheduler(
            MedicationAlarmRepository medicationAlarmRepository,
            MedicationLogRepository medicationLogRepository,
            WebPushSubscriptionService subscriptionService,
            WebPushSender webPushSender,
            WebPushProperties properties) {
        this.medicationAlarmRepository = medicationAlarmRepository;
        this.medicationLogRepository = medicationLogRepository;
        this.subscriptionService = subscriptionService;
        this.webPushSender = webPushSender;
        this.zoneId = resolveZoneId(properties);
    }

    @Transactional(readOnly = true)
    @Scheduled(cron = "0 * * * * *")
    public void dispatchDueNotifications() {
        if (!webPushSender.isEnabled()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now(zoneId).truncatedTo(ChronoUnit.MINUTES);
        List<MedicationAlarm> alarms = medicationAlarmRepository.findByActiveTrue();
        if (alarms.isEmpty()) {
            return;
        }

        sendScheduledNotifications(alarms, now);
        sendReminderNotifications(alarms, now);
    }

    private void sendScheduledNotifications(List<MedicationAlarm> alarms, LocalDateTime now) {
        DayOfWeek today = now.getDayOfWeek();
        LocalTime targetTime = now.toLocalTime();
        alarms.stream()
                .filter(alarm -> matchesDay(alarm, today))
                .filter(alarm -> alarm.getAlarmTime().truncatedTo(ChronoUnit.MINUTES).equals(targetTime))
                .forEach(alarm -> notifySubscribers(alarm, now, false));
    }

    private void sendReminderNotifications(List<MedicationAlarm> alarms, LocalDateTime now) {
        LocalDateTime reminderReference = now.minusMinutes(50).truncatedTo(ChronoUnit.MINUTES);
        DayOfWeek reminderDay = reminderReference.getDayOfWeek();
        LocalTime reminderTime = reminderReference.toLocalTime();

        alarms.stream()
                .filter(alarm -> matchesDay(alarm, reminderDay))
                .filter(alarm -> alarm.getAlarmTime().truncatedTo(ChronoUnit.MINUTES).equals(reminderTime))
                .forEach(alarm -> sendReminderIfUnconfirmed(alarm, reminderReference, now));
    }

    private void sendReminderIfUnconfirmed(MedicationAlarm alarm, LocalDateTime scheduledTime, LocalDateTime now) {
        if (alarm.getId() == null) {
            return;
        }
        if (hasConfirmedMedication(alarm, scheduledTime, now)) {
            return;
        }
        notifySubscribers(alarm, scheduledTime, true);
    }

    private boolean hasConfirmedMedication(MedicationAlarm alarm, LocalDateTime scheduledTime, LocalDateTime windowEnd) {
        LocalDateTime windowStart = scheduledTime.minusMinutes(10);
        return medicationLogRepository.existsByAlarm_IdAndLogTimestampBetween(
                alarm.getId(), windowStart, windowEnd);
    }

    private void notifySubscribers(MedicationAlarm alarm, LocalDateTime scheduledTime, boolean reminder) {
        List<WebPushSubscription> subscriptions = subscriptionService.findByUser(alarm.getClient().getId());
        if (subscriptions.isEmpty()) {
            return;
        }

        Map<String, Object> payload = buildPayload(alarm, scheduledTime, reminder);
        subscriptions.forEach(subscription -> webPushSender.send(subscription, payload));
    }

    private Map<String, Object> buildPayload(MedicationAlarm alarm, LocalDateTime scheduledTime, boolean reminder) {
        String medicineName = alarm.getMedicine().getName();
        String dosageUnit = StringUtils.hasText(alarm.getDosageUnit()) ? alarm.getDosageUnit() : "";
        String body =
                reminder
                        ? String.format(
                                "%s %d%s 복용까지 10분 남았습니다. 복약을 확인해주세요.",
                                medicineName, alarm.getDosageAmount(), dosageUnit)
                        : String.format(
                                "%s %d%s 복용할 시간입니다.", medicineName, alarm.getDosageAmount(), dosageUnit);

        Map<String, Object> data = new HashMap<>();
        data.put("alarmId", alarm.getId());
        data.put("clientId", alarm.getClient().getId());
        data.put("medicineId", alarm.getMedicine().getId());
        data.put("scheduledAt", scheduledTime.toString());
        data.put("reminder", reminder);

        Map<String, Object> notification = new HashMap<>();
        notification.put("title", "복약 알림");
        notification.put("body", body);
        notification.put("icon", "/vercel.svg");
        notification.put("tag", reminder ? "medication-" + alarm.getId() + "-reminder" : "medication-" + alarm.getId());
        notification.put("data", data);
        if (reminder) {
            notification.put("renotify", true);
        }
        return notification;
    }

    private boolean matchesDay(MedicationAlarm alarm, DayOfWeek target) {
        if (!StringUtils.hasText(alarm.getDaysOfWeek())) {
            return true;
        }
        return Arrays.stream(alarm.getDaysOfWeek().split(","))
                .map(value -> value.trim().toUpperCase(Locale.ROOT))
                .filter(StringUtils::hasText)
                .anyMatch(token -> switch (token) {
                    case "ALL" -> true;
                    case "WEEKDAY" -> EnumSet.of(
                                    DayOfWeek.MONDAY,
                                    DayOfWeek.TUESDAY,
                                    DayOfWeek.WEDNESDAY,
                                    DayOfWeek.THURSDAY,
                                    DayOfWeek.FRIDAY)
                            .contains(target);
                    case "WEEKEND" -> EnumSet.of(DayOfWeek.SATURDAY, DayOfWeek.SUNDAY).contains(target);
                    default -> {
                        try {
                            yield DayOfWeek.valueOf(token) == target;
                        } catch (IllegalArgumentException ignored) {
                            yield false;
                        }
                    }
                });
    }

    private ZoneId resolveZoneId(WebPushProperties properties) {
        if (properties != null
                && properties.scheduler() != null
                && StringUtils.hasText(properties.scheduler().timezone())) {
            return ZoneId.of(properties.scheduler().timezone());
        }
        return ZoneId.of("Asia/Seoul");
    }
}
