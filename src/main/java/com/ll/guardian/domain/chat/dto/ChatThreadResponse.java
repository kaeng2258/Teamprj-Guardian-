// src/main/java/com/ll/guardian/domain/chat/dto/ChatThreadResponse.java
package com.ll.guardian.domain.chat.dto;

import com.ll.guardian.domain.chat.entity.ChatRoom;
import java.time.LocalDateTime;

public record ChatThreadResponse(
        Long roomId,
        Long clientId,
        Long providerId,
        String clientName,
        String providerName,
        String lastMessageSnippet,
        LocalDateTime lastMessageAt,
        boolean readByClient,
        boolean readByProvider
) {

    public static ChatThreadResponse from(ChatRoom room) {
        return new ChatThreadResponse(
                room.getId(),
                room.getClient().getId(),
                room.getProvider().getId(),
                // ✅ 여기서 실제 이름 넣기
                room.getClient().getName(),      // 또는 room.getClient().getUser().getName() 등 실제 필드에 맞게
                room.getProvider().getName(),    // 마찬가지
                room.getLastMessageSnippet(),
                room.getLastMessageAt(),
                room.isReadByClient(),
                room.isReadByProvider()
        );
    }
}
