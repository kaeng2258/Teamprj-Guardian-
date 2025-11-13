package com.ll.guardian.domain.notification.service;

import com.ll.guardian.domain.alarm.entity.MedicationAlarm;
import com.ll.guardian.domain.alarm.repository.MedicationAlarmRepository;
import com.ll.guardian.domain.notification.entity.WebPushSubscription;
import com.ll.guardian.global.config.properties.WebPushProperties;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
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
    private final WebPushSender webPushSender;
    private final ZoneId zoneId;

    public MedicationReminderScheduler(
            MedicationAlarmRepository medicationAlarmRepository,
            WebPushSubscriptionService subscriptionService,
            WebPushSender webPushSender,
            WebPushProperties properties) {
        this.medicationAlarmRepository = medicationAlarmRepository;
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
        DayOfWeek today = now.getDayOfWeek();

        List<MedicationAlarm> alarms = medicationAlarmRepository.findByActiveTrue();
        alarms.stream()
                .filter(alarm -> matchesDay(alarm, today))
                .filter(alarm -> alarm.getAlarmTime().truncatedTo(ChronoUnit.MINUTES).equals(now.toLocalTime()))
                .forEach(alarm -> notifySubscribers(alarm, now));
    }

    private void notifySubscribers(MedicationAlarm alarm, LocalDateTime scheduledTime) {
        List<WebPushSubscription> subscriptions = subscriptionService.findByUser(alarm.getClient().getId());
        if (subscriptions.isEmpty()) {
            return;
        }

        Map<String, Object> payload = buildPayload(alarm, scheduledTime);
        subscriptions.forEach(subscription -> webPushSender.send(subscription, payload));
    }

    private Map<String, Object> buildPayload(MedicationAlarm alarm, LocalDateTime scheduledTime) {
        String medicineName = alarm.getMedicine().getName();
        String body = String.format(
                "%s %d%s 복용할 시간입니다.",
                medicineName,
                alarm.getDosageAmount(),
                StringUtils.hasText(alarm.getDosageUnit()) ? alarm.getDosageUnit() : "");

        Map<String, Object> data = new HashMap<>();
        data.put("alarmId", alarm.getId());
        data.put("clientId", alarm.getClient().getId());
        data.put("medicineId", alarm.getMedicine().getId());
        data.put("scheduledAt", scheduledTime.toString());

        Map<String, Object> notification = new HashMap<>();
        notification.put("title", "복약 알림");
        notification.put("body", body);
        notification.put("icon", "/vercel.svg");
        notification.put("tag", "medication-" + alarm.getId());
        notification.put("data", data);
        return notification;
    }

    private boolean matchesDay(MedicationAlarm alarm, DayOfWeek target) {
        if (!StringUtils.hasText(alarm.getDaysOfWeek())) {
            return true;
        }
        return Arrays.stream(alarm.getDaysOfWeek().split(","))
                .map(value -> value.trim().toUpperCase(Locale.ROOT))
                .filter(StringUtils::hasText)
                .map(DayOfWeek::valueOf)
                .anyMatch(day -> day == target);
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
