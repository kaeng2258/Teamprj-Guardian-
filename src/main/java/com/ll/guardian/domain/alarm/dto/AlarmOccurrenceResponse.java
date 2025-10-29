package com.ll.guardian.domain.alarm.dto;

import com.ll.guardian.domain.alarm.AlarmOccurrenceStatus;
import com.ll.guardian.domain.alarm.entity.AlarmOccurrence;
import java.time.LocalDateTime;

public record AlarmOccurrenceResponse(
        Long id,
        Long alarmId,
        LocalDateTime scheduledTime,
        LocalDateTime actualResponseTime,
        AlarmOccurrenceStatus status,
        boolean notifiedProvider,
        String providerNotes) {

    public static AlarmOccurrenceResponse from(AlarmOccurrence occurrence) {
        return new AlarmOccurrenceResponse(
                occurrence.getId(),
                occurrence.getAlarm().getId(),
                occurrence.getScheduledTime(),
                occurrence.getActualResponseTime(),
                occurrence.getStatus(),
                occurrence.isNotifiedProvider(),
                occurrence.getProviderNotes());
    }
}
