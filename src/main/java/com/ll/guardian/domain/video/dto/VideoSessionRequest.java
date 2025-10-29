package com.ll.guardian.domain.video.dto;

import com.ll.guardian.domain.video.CallType;
import jakarta.validation.constraints.NotNull;

public record VideoSessionRequest(
        @NotNull(message = "발신자 ID를 입력해주세요.") Long callerId,
        @NotNull(message = "수신자 ID를 입력해주세요.") Long receiverId,
        @NotNull(message = "통화 유형을 입력해주세요.") CallType callType,
        String offerSdp) {}
