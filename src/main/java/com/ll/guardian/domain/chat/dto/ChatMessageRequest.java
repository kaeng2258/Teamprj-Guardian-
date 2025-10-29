package com.ll.guardian.domain.chat.dto;

import com.ll.guardian.domain.chat.MessageType;
import jakarta.validation.constraints.NotNull;

public record ChatMessageRequest(
        @NotNull(message = "채팅방 ID를 입력해주세요.") Long roomId,
        @NotNull(message = "발신자 ID를 입력해주세요.") Long senderId,
        String content,
        MessageType messageType,
        String fileUrl) {}
