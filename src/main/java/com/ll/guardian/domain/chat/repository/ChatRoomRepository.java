package com.ll.guardian.domain.chat.repository;

import com.ll.guardian.domain.chat.entity.ChatRoom;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    Optional<ChatRoom> findByClientIdAndManagerId(Long clientId, Long managerId);

    List<ChatRoom> findByClient_IdOrManager_Id(Long userId1, Long userId2);
}
