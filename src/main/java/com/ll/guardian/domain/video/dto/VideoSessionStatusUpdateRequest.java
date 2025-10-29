package com.ll.guardian.domain.video.dto;

import com.ll.guardian.domain.video.VideoSessionStatus;
import jakarta.validation.constraints.NotNull;

public record VideoSessionStatusUpdateRequest(
        @NotNull(message = "세션 ID를 입력해주세요.") Long sessionId,
        @NotNull(message = "상태를 입력해주세요.") VideoSessionStatus status,
        String answerSdp,
        Integer durationSeconds,
        Float qualityScore) {}
