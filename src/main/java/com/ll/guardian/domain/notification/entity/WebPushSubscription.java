package com.ll.guardian.domain.notification.entity;

import com.ll.guardian.domain.user.entity.User;
import com.ll.guardian.global.common.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
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
@Table(
        name = "web_push_subscription",
        uniqueConstraints = @UniqueConstraint(name = "uk_web_push_endpoint", columnNames = "endpoint"))
public class WebPushSubscription extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "subscription_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "endpoint", nullable = false, length = 1024)
    private String endpoint;

    @Column(name = "auth_key", nullable = false, length = 255)
    private String auth;

    @Column(name = "p256dh_key", nullable = false, length = 255)
    private String p256dh;

    @Column(name = "expiration_time")
    private Long expirationTime;

    @Column(name = "user_agent", length = 512)
    private String userAgent;

    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;

    public void refreshKeys(String auth, String p256dh, Long expirationTime, String userAgent) {
        this.auth = auth;
        this.p256dh = p256dh;
        this.expirationTime = expirationTime;
        this.userAgent = userAgent;
        touch();
    }

    public void touch() {
        this.lastUsedAt = LocalDateTime.now();
    }

    public void assignUser(User user) {
        this.user = user;
    }
}
