package com.ll.guardian.domain.chat.dto;

import com.ll.guardian.domain.chat.entity.ChatMessage;
import java.time.LocalDateTime;

public record ChatMessageResponse(
        Long messageId,
        Long roomId,
        Long senderId,
        String content,
        String messageType,
        String fileUrl,
        LocalDateTime sentAt) {

    public static ChatMessageResponse from(ChatMessage message) {
        return new ChatMessageResponse(
                message.getId(),
                message.getRoom().getId(),
                message.getSender().getId(),
                message.getContent(),
                message.getMessageType().name(),
                message.getFileUrl(),
                message.getSentAt());
    }
}
