package com.ll.guardian.domain.video.entity;

import com.ll.guardian.domain.video.CallType;
import com.ll.guardian.domain.video.VideoSessionStatus;
import com.ll.guardian.domain.user.entity.User;
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
@Table(name = "video_session")
public class VideoSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "session_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "caller_user_id", nullable = false)
    private User caller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_user_id", nullable = false)
    private User receiver;

    @Enumerated(EnumType.STRING)
    @Column(name = "call_type", nullable = false, length = 20)
    private CallType callType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private VideoSessionStatus status;

    @Column(name = "offer_sdp", columnDefinition = "TEXT")
    private String offerSdp;

    @Column(name = "answer_sdp", columnDefinition = "TEXT")
    private String answerSdp;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "duration_sec")
    private Integer durationSeconds;

    @Column(name = "quality_score")
    private Float qualityScore;

    public void updateStatus(
            VideoSessionStatus status, String answerSdp, Integer durationSeconds, Float qualityScore) {
        this.status = status;
        this.answerSdp = answerSdp;
        if (VideoSessionStatus.ENDED.equals(status)) {
            this.endedAt = LocalDateTime.now();
        }
        if (durationSeconds != null) {
            this.durationSeconds = durationSeconds;
        }
        if (qualityScore != null) {
            this.qualityScore = qualityScore;
        }
    }
}
