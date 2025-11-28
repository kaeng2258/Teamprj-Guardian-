package com.ll.guardian.domain.chat.service;

import com.ll.guardian.domain.chat.MessageType;
import com.ll.guardian.domain.chat.dto.ChatMessageRequest;
import com.ll.guardian.domain.chat.dto.ChatMessageResponse;
import com.ll.guardian.domain.chat.dto.ChatThreadResponse;
import com.ll.guardian.domain.chat.entity.ChatMessage;
import com.ll.guardian.domain.chat.entity.ChatRoom;
import com.ll.guardian.domain.chat.repository.ChatMessageRepository;
import com.ll.guardian.domain.chat.repository.ChatRoomRepository;
import com.ll.guardian.domain.matching.repository.CareMatchRepository;
import com.ll.guardian.domain.user.entity.User;
import com.ll.guardian.domain.user.repository.UserRepository;
import com.ll.guardian.global.exception.GuardianException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final CareMatchRepository careMatchRepository;
    private final UserRepository userRepository;

    public ChatService(
            ChatRoomRepository chatRoomRepository,
            ChatMessageRepository chatMessageRepository,
            CareMatchRepository careMatchRepository,
            UserRepository userRepository) {
        this.chatRoomRepository = chatRoomRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.careMatchRepository = careMatchRepository;
        this.userRepository = userRepository;
    }

    /** 내가 속한 채팅 스레드(방 목록) */
    @Transactional(readOnly = true)
    public List<ChatThreadResponse> getThreadsForUser(Long userId) {
        return chatRoomRepository.findAll().stream()
                .filter(room -> room.getClient().getId().equals(userId) || room.getManager().getId().equals(userId))
                .filter(room -> isCurrentlyMatched(room.getClient().getId(), room.getManager().getId()))
                .map(ChatThreadResponse::from)
                .collect(Collectors.toList());
    }

    /** 메시지 전송 */
    public ChatMessageResponse sendMessage(ChatMessageRequest request) {
        ChatRoom room = chatRoomRepository
                .findById(request.roomId())
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "채팅방을 찾을 수 없습니다."));
        User sender = getUser(request.senderId());

        if (!room.getClient().getId().equals(sender.getId())
                && !room.getManager().getId().equals(sender.getId())) {
            throw new GuardianException(HttpStatus.FORBIDDEN, "채팅방에 참여한 사용자만 메시지를 보낼 수 있습니다.");
        }

        ensureCurrentMatch(room);

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

    /** 특정 방의 전체 메시지(오름차순) */
    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(Long roomId) {
        ChatRoom room = chatRoomRepository
                .findById(roomId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "채팅방을 찾을 수 없습니다."));
        ensureCurrentMatch(room);

        return chatMessageRepository.findByRoomIdOrderBySentAtAsc(roomId).stream()
                .map(ChatMessageResponse::from)
                .collect(Collectors.toList());
    }

    /** 스레드 읽음 처리 */
    public void markThreadAsRead(Long roomId, Long userId) {
        ChatRoom room = chatRoomRepository
                .findById(roomId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "채팅방을 찾을 수 없습니다."));
        ensureCurrentMatch(room);
        if (room.getClient().getId().equals(userId)) {
            room.markAsReadByClient();
        } else if (room.getManager().getId().equals(userId)) {
            room.markAsReadByManager();
        } else {
            throw new GuardianException(HttpStatus.FORBIDDEN, "채팅방에 참여한 사용자만 읽음 처리가 가능합니다.");
        }
    }

    /** (추가) 방 개설 또는 기존 방 반환 */
    public ChatRoom openOrGetRoom(Long clientId, Long managerId) {
        if (clientId.equals(managerId)) {
            throw new GuardianException(HttpStatus.BAD_REQUEST, "클라이언트와 매니저가 동일할 수 없습니다.");
        }

        if (!isCurrentlyMatched(clientId, managerId)) {
            throw new GuardianException(HttpStatus.FORBIDDEN, "배정된 매칭이 해제되어 채팅을 열 수 없습니다.");
        }

        User client = getUser(clientId);
        User manager = getUser(managerId);

        return chatRoomRepository
                .findByClientIdAndManagerId(client.getId(), manager.getId())
                .orElseGet(() -> {
                    ChatRoom newRoom = ChatRoom.builder()
                            .client(client)
                            .manager(manager)
                            .readByClient(true)   // 생성 시점엔 둘 다 읽음 상태로 시작해도 무방
                            .readByManager(true) // (요건에 맞게 조정 가능)
                            .build();
                    return chatRoomRepository.save(newRoom);
                });
    }

    /** (추가) 단일 방 조회 */
    @Transactional(readOnly = true)
    public ChatRoom getRoom(Long roomId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "채팅방을 찾을 수 없습니다."));
        ensureCurrentMatch(room);
        return room;
    }

    // ---- 내부 유틸 ----
    private User getUser(Long userId) {
        return userRepository
                .findById(userId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
    }
    public void deleteRoom(Long roomId, Long userId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "채팅방을 찾을 수 없습니다."));

        // ✅ 권한: 방에 속한 사람만 삭제 가능(둘 중 아무나)
        if (!(room.getClient().getId().equals(userId) || room.getManager().getId().equals(userId))) {
            throw new GuardianException(HttpStatus.FORBIDDEN, "해당 방 참여자만 삭제할 수 있습니다.");
        }

        // ✅ 메시지 먼저 제거(외래키 제약 대비)
        chatMessageRepository.deleteByRoomId(roomId);

        // ✅ 방 제거
        chatRoomRepository.delete(room);
    }

    private boolean isCurrentlyMatched(Long clientId, Long managerId) {
        return careMatchRepository.findFirstByClientIdAndManagerIdAndCurrentTrue(clientId, managerId).isPresent();
    }

    private void ensureCurrentMatch(ChatRoom room) {
        if (!isCurrentlyMatched(room.getClient().getId(), room.getManager().getId())) {
            throw new GuardianException(HttpStatus.FORBIDDEN, "배정이 해제된 상태에서는 채팅을 이용할 수 없습니다.");
        }
    }
}
