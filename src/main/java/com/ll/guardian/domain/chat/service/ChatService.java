package com.ll.guardian.domain.chat.service;

import com.ll.guardian.domain.chat.MessageType;
import com.ll.guardian.domain.chat.dto.ChatMessageRequest;
import com.ll.guardian.domain.chat.dto.ChatMessageResponse;
import com.ll.guardian.domain.chat.dto.ChatThreadResponse;
import com.ll.guardian.domain.chat.entity.ChatMessage;
import com.ll.guardian.domain.chat.entity.ChatRoom;
import com.ll.guardian.domain.chat.repository.ChatMessageRepository;
import com.ll.guardian.domain.chat.repository.ChatRoomRepository;
import com.ll.guardian.domain.notification.entity.WebPushSubscription;
import com.ll.guardian.domain.notification.service.WebPushSender;
import com.ll.guardian.domain.notification.service.WebPushSubscriptionService;
import com.ll.guardian.domain.user.entity.User;
import com.ll.guardian.domain.user.repository.UserRepository;
import com.ll.guardian.global.exception.GuardianException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
    private final WebPushSubscriptionService webPushSubscriptionService;
    private final WebPushSender webPushSender;

    public ChatService(
            ChatRoomRepository chatRoomRepository,
            ChatMessageRepository chatMessageRepository,
            UserRepository userRepository,
            WebPushSubscriptionService webPushSubscriptionService,
            WebPushSender webPushSender) {
        this.chatRoomRepository = chatRoomRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
        this.webPushSubscriptionService = webPushSubscriptionService;
        this.webPushSender = webPushSender;
    }

    /** 내가 속한 채팅 스레드(방 목록) */
    @Transactional(readOnly = true)
    public List<ChatThreadResponse> getThreadsForUser(Long userId) {
        return chatRoomRepository.findAll().stream()
                .filter(room -> room.getClient().getId().equals(userId) || room.getManager().getId().equals(userId))
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
        notifyCounterpart(room, sender, saved);
        return ChatMessageResponse.from(saved);
    }

    /** 특정 방의 전체 메시지(오름차순) */
    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(Long roomId, Long userId) {
        ChatRoom room = chatRoomRepository
                .findById(roomId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "채팅방을 찾을 수 없습니다."));
        assertParticipant(room, userId);

        return chatMessageRepository.findByRoomIdOrderBySentAtAsc(roomId).stream()
                .map(ChatMessageResponse::from)
                .collect(Collectors.toList());
    }

    /** 스레드 읽음 처리 */
    public void markThreadAsRead(Long roomId, Long userId) {
        ChatRoom room = chatRoomRepository
                .findById(roomId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "채팅방을 찾을 수 없습니다."));
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
        return room;
    }

    // ---- 내부 유틸 ----
    private User getUser(Long userId) {
        return userRepository
                .findById(userId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
    }

    @Transactional(readOnly = true)
    public Long getUserIdByEmail(String email) {
        return userRepository.findByEmail(email)
            .map(User::getId)
            .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
    }

    @Transactional(readOnly = true)
    public String getRecipientEmail(Long roomId, Long senderId) {
        ChatRoom room = chatRoomRepository
            .findById(roomId)
            .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "채팅방을 찾을 수 없습니다."));
        assertParticipant(room, senderId);
        if (room.getClient().getId().equals(senderId)) {
            return room.getManager().getEmail();
        }
        return room.getClient().getEmail();
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

    @Transactional(readOnly = true)
    public void assertParticipant(Long roomId, Long userId) {
        ChatRoom room = chatRoomRepository
            .findById(roomId)
            .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "채팅방을 찾을 수 없습니다."));
        assertParticipant(room, userId);
    }

    private void assertParticipant(ChatRoom room, Long userId) {
        if (userId == null || room == null) {
            throw new GuardianException(HttpStatus.FORBIDDEN, "채팅방 접근 권한이 없습니다.");
        }
        if (!room.getClient().getId().equals(userId) && !room.getManager().getId().equals(userId)) {
            throw new GuardianException(HttpStatus.FORBIDDEN, "채팅방에 참여한 사용자만 접근할 수 있습니다.");
        }
    }

    private void notifyCounterpart(ChatRoom room, User sender, ChatMessage message) {
        if (!webPushSender.isEnabled()) {
            return;
        }

        Long recipientId = resolveRecipient(room, sender);
        if (recipientId == null) {
            return;
        }

        List<WebPushSubscription> subscriptions = webPushSubscriptionService.findByUser(recipientId);
        if (subscriptions.isEmpty()) {
            return;
        }

        Map<String, Object> payload = buildChatPayload(room, sender, message);
        subscriptions.forEach(subscription -> webPushSender.send(subscription, payload));
    }

    private Long resolveRecipient(ChatRoom room, User sender) {
        if (room.getClient().getId().equals(sender.getId())) {
            return room.getManager().getId();
        }
        if (room.getManager().getId().equals(sender.getId())) {
            return room.getClient().getId();
        }
        return null;
    }

    private Map<String, Object> buildChatPayload(ChatRoom room, User sender, ChatMessage message) {
        String senderName = sender.getName() != null ? sender.getName() : "알림";
        String snippet = truncate(buildSnippet(message), 80);

        Map<String, Object> data = new HashMap<>();
        data.put("roomId", room.getId());
        data.put("senderId", sender.getId());
        data.put("senderName", senderName);
        data.put("type", "chat");
        data.put("url", "/chat/" + room.getId());

        Map<String, Object> payload = new HashMap<>();
        payload.put("title", "새 메시지");
        payload.put("body", senderName + ": " + snippet);
        payload.put("icon", "/vercel.svg");
        payload.put("tag", "chat-room-" + room.getId());
        payload.put("renotify", true);
        payload.put("data", data);
        return payload;
    }

    private String buildSnippet(ChatMessage message) {
        return switch (message.getMessageType()) {
            case IMAGE -> "사진이 도착했습니다.";
            case FILE -> "파일이 도착했습니다.";
            case NOTICE -> safeContent(message.getContent());
            case CALL_START -> "영상통화 요청이 도착했습니다.";
            case CALL_END -> "통화가 종료되었습니다.";
            case TEXT -> safeContent(message.getContent());
        };
    }

    private String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, Math.max(0, maxLength - 3)) + "...";
    }

    private String safeContent(String value) {
        return value != null ? value : "";
    }
}
