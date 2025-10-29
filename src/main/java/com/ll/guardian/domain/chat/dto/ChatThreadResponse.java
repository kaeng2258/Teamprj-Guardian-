package com.ll.guardian.domain.chat.dto;

import com.ll.guardian.domain.chat.entity.ChatRoom;
import java.time.LocalDateTime;

public record ChatThreadResponse(
        Long roomId,
        Long clientId,
        Long providerId,
        String lastMessageSnippet,
        LocalDateTime lastMessageAt,
        boolean readByClient,
        boolean readByProvider) {

    public static ChatThreadResponse from(ChatRoom room) {
        return new ChatThreadResponse(
                room.getId(),
                room.getClient().getId(),
                room.getProvider().getId(),
                room.getLastMessageSnippet(),
                room.getLastMessageAt(),
                room.isReadByClient(),
                room.isReadByProvider());
    }
}
