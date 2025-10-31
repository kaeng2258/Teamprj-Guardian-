package com.ll.guardian.domain.chat.repository;

import com.ll.guardian.domain.chat.entity.ChatMessage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByRoomIdOrderBySentAtAsc(Long roomId);

    // ✅ 방의 모든 메시지 삭제
    void deleteByRoomId(Long roomId);
}