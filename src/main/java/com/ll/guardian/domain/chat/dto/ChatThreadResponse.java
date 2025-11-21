// src/main/java/com/ll/guardian/domain/chat/dto/ChatThreadResponse.java
package com.ll.guardian.domain.chat.dto;

import com.ll.guardian.domain.chat.entity.ChatRoom;
import java.time.LocalDateTime;

public record ChatThreadResponse(
        Long roomId,
        Long clientId,
        Long managerId,
        String clientName,
        String managerName,
        String lastMessageSnippet,
        LocalDateTime lastMessageAt,
        boolean readByClient,
        boolean readByManager
) {

    public static ChatThreadResponse from(ChatRoom room) {
        return new ChatThreadResponse(
                room.getId(),
                room.getClient().getId(),
                room.getManager().getId(),
                // ✅ 여기서 실제 이름 넣기
                room.getClient().getName(),      // 또는 room.getClient().getUser().getName() 등 실제 필드에 맞게
                room.getManager().getName(),    // 마찬가지
                room.getLastMessageSnippet(),
                room.getLastMessageAt(),
                room.isReadByClient(),
                room.isReadByManager()
        );
    }
}
