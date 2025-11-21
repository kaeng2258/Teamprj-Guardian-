package com.ll.guardian.domain.alarm.entity;

import com.ll.guardian.domain.alarm.AlarmOccurrenceStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Entity
@Table(name = "alarm_occurrence")
public class AlarmOccurrence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "occurrence_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alarm_id", nullable = false)
    private MedicationAlarm alarm;

    @Column(name = "scheduled_time", nullable = false)
    private LocalDateTime scheduledTime;

    @Column(name = "actual_response_time")
    private LocalDateTime actualResponseTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private AlarmOccurrenceStatus status;

    @Column(name = "is_notified_manager", nullable = false)
    private boolean notifiedManager;

    @Column(name = "manager_notes", columnDefinition = "TEXT")
    private String managerNotes;

    public void updateStatus(
            com.ll.guardian.domain.alarm.AlarmOccurrenceStatus status,
            LocalDateTime actualResponseTime,
            String managerNotes) {
        this.status = status;
        this.actualResponseTime = actualResponseTime;
        this.managerNotes = managerNotes;
    }
}
