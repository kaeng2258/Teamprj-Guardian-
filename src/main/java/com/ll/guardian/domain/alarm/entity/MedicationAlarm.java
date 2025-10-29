package com.ll.guardian.domain.alarm.entity;

import com.ll.guardian.global.common.BaseTimeEntity;
import com.ll.guardian.domain.medicine.entity.Medicine;
import com.ll.guardian.domain.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalTime;
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
@Table(name = "alarm")
public class MedicationAlarm extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "alarm_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_user_id", nullable = false)
    private User client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medicine_id", nullable = false)
    private Medicine medicine;

    @Column(name = "dosage_amount", nullable = false)
    private Integer dosageAmount;

    @Column(name = "dosage_unit", nullable = false, length = 50)
    private String dosageUnit;

    @Column(name = "alarm_time", nullable = false)
    private LocalTime alarmTime;

    @Column(name = "days_of_week", nullable = false, length = 50)
    private String daysOfWeek;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    public void updatePlan(
            Integer dosageAmount, String dosageUnit, LocalTime alarmTime, String daysOfWeek, boolean active) {
        this.dosageAmount = dosageAmount;
        this.dosageUnit = dosageUnit;
        this.alarmTime = alarmTime;
        this.daysOfWeek = daysOfWeek;
        this.active = active;
    }
}
