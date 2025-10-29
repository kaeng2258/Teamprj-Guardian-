package com.ll.guardian.domain.chat.service;

import com.ll.guardian.domain.chat.MessageType;
import com.ll.guardian.domain.chat.dto.ChatMessageRequest;
import com.ll.guardian.domain.chat.dto.ChatMessageResponse;
import com.ll.guardian.domain.chat.dto.ChatThreadResponse;
import com.ll.guardian.domain.chat.entity.ChatMessage;
import com.ll.guardian.domain.chat.entity.ChatRoom;
import com.ll.guardian.domain.chat.repository.ChatMessageRepository;
import com.ll.guardian.domain.chat.repository.ChatRoomRepository;
import com.ll.guardian.domain.user.entity.User;
import com.ll.guardian.domain.user.repository.UserRepository;
import com.ll.guardian.global.exception.GuardianException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    public ChatService(
            ChatRoomRepository chatRoomRepository,
            ChatMessageRepository chatMessageRepository,
            UserRepository userRepository) {
        this.chatRoomRepository = chatRoomRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ChatThreadResponse> getThreadsForUser(Long userId) {
        return chatRoomRepository.findAll().stream()
                .filter(room -> room.getClient().getId().equals(userId) || room.getProvider().getId().equals(userId))
                .map(ChatThreadResponse::from)
                .collect(Collectors.toList());
    }

    public ChatMessageResponse sendMessage(ChatMessageRequest request) {
        ChatRoom room = chatRoomRepository
                .findById(request.roomId())
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "채팅방을 찾을 수 없습니다."));
        User sender = getUser(request.senderId());

        if (!room.getClient().getId().equals(sender.getId())
                && !room.getProvider().getId().equals(sender.getId())) {
            throw new GuardianException(HttpStatus.FORBIDDEN, "채팅방에 참여한 사용자만 메시지를 보낼 수 있습니다.");
        }

        ChatMessage message = ChatMessage.builder()
                .room(room)
                .sender(sender)
                .content(request.content())
                .messageType(request.messageType() != null ? request.messageType() : MessageType.TEXT)
                .fileUrl(request.fileUrl())
                .sentAt(LocalDateTime.now())
                .build();

        ChatMessage saved = chatMessageRepository.save(message);
        room.updateLastMessage(saved.getContent(), saved.getSentAt(), sender.getId());
        return ChatMessageResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(Long roomId) {
        return chatMessageRepository.findByRoomIdOrderBySentAtAsc(roomId).stream()
                .map(ChatMessageResponse::from)
                .collect(Collectors.toList());
    }

    public void markThreadAsRead(Long roomId, Long userId) {
        ChatRoom room = chatRoomRepository
                .findById(roomId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "채팅방을 찾을 수 없습니다."));
        if (room.getClient().getId().equals(userId)) {
            room.markAsReadByClient();
        } else if (room.getProvider().getId().equals(userId)) {
            room.markAsReadByProvider();
        } else {
            throw new GuardianException(HttpStatus.FORBIDDEN, "채팅방에 참여한 사용자만 읽음 처리가 가능합니다.");
        }
    }

    private User getUser(Long userId) {
        return userRepository
                .findById(userId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
    }
}
