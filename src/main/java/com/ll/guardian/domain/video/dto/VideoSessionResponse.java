package com.ll.guardian.domain.video.dto;

import com.ll.guardian.domain.video.entity.VideoSession;
import java.time.LocalDateTime;

public record VideoSessionResponse(
        Long sessionId,
        Long callerId,
        Long receiverId,
        String callType,
        String status,
        String offerSdp,
        String answerSdp,
        LocalDateTime startedAt,
        LocalDateTime endedAt,
        Integer durationSeconds,
        Float qualityScore) {

    public static VideoSessionResponse from(VideoSession session) {
        return new VideoSessionResponse(
                session.getId(),
                session.getCaller().getId(),
                session.getReceiver().getId(),
                session.getCallType().name(),
                session.getStatus().name(),
                session.getOfferSdp(),
                session.getAnswerSdp(),
                session.getStartedAt(),
                session.getEndedAt(),
                session.getDurationSeconds(),
                session.getQualityScore());
    }
}
