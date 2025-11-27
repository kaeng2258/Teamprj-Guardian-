package com.ll.guardian.domain.emergency.entity;

import com.ll.guardian.domain.emergency.EmergencyAlertStatus;
import com.ll.guardian.domain.emergency.EmergencyAlertType;
import com.ll.guardian.domain.user.entity.User;
import jakarta.persistence.*;

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
@Table(name = "emergency_alert")
public class EmergencyAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "alert_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_user_id", nullable = false)
    private User client;


    @Enumerated(EnumType.STRING)
    @Column(name = "alert_type", nullable = false, length = 30)
    private EmergencyAlertType alertType;

    @Column(name = "alert_time", nullable = false)
    private LocalDateTime alertTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private EmergencyAlertStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by_user_id")
    private User resolvedBy;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "memo", columnDefinition = "TEXT")
    private String memo;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    public void markResolved(User resolvedBy, LocalDateTime resolvedAt, EmergencyAlertStatus status, String memo) {
        this.resolvedBy = resolvedBy;
        this.resolvedAt = resolvedAt;
        this.status = status;
        this.memo = memo;
    }
}
