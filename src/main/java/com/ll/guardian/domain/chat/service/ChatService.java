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

    /** Threads for the given user (participates as client or manager) */
    @Transactional(readOnly = true)
    public List<ChatThreadResponse> getThreadsForUser(Long userId) {
        return chatRoomRepository.findByClient_IdOrManager_Id(userId, userId).stream()
                .map(ChatThreadResponse::from)
                .toList();
    }

    /** Send message inside a room */
    public ChatMessageResponse sendMessage(ChatMessageRequest request) {
        ChatRoom room = chatRoomRepository
                .findById(request.roomId())
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "채팅방을 찾을 수 없습니다."));
        User sender = getUser(request.senderId());

        if (!room.getClient().getId().equals(sender.getId())
                && !room.getManager().getId().equals(sender.getId())) {
            throw new GuardianException(HttpStatus.FORBIDDEN, "채팅방 참가자만 메시지를 보낼 수 있습니다.");
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

    /** Full message history ordered by sent time */
    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(Long roomId, Long userId) {
        ChatRoom room = chatRoomRepository
                .findById(roomId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "채팅방을 찾을 수 없습니다."));
        assertParticipant(room, userId);

        return chatMessageRepository.findByRoomIdOrderBySentAtAsc(roomId).stream()
                .map(ChatMessageResponse::from)
                .toList();
    }

    /** Mark thread as read */
    public void markThreadAsRead(Long roomId, Long userId) {
        ChatRoom room = chatRoomRepository
                .findById(roomId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "채팅방을 찾을 수 없습니다."));
        if (room.getClient().getId().equals(userId)) {
            room.markAsReadByClient();
        } else if (room.getManager().getId().equals(userId)) {
            room.markAsReadByManager();
        } else {
            throw new GuardianException(HttpStatus.FORBIDDEN, "채팅방 참가자만 읽음 처리가 가능합니다.");
        }
    }

    /** Create room or return existing */
    public ChatRoom openOrGetRoom(Long clientId, Long managerId) {
        if (clientId.equals(managerId)) {
            throw new GuardianException(HttpStatus.BAD_REQUEST, "클라이언트와 매니저가 같을 수 없습니다.");
        }

        User client = getUser(clientId);
        User manager = getUser(managerId);

        return chatRoomRepository
                .findByClientIdAndManagerId(client.getId(), manager.getId())
                .orElseGet(() -> {
                    ChatRoom newRoom = ChatRoom.builder()
                            .client(client)
                            .manager(manager)
                            .readByClient(true)
                            .readByManager(true)
                            .build();
                    return chatRoomRepository.save(newRoom);
                });
    }

    @Transactional(readOnly = true)
    public ChatRoom getRoom(Long roomId) {
        return chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "채팅방을 찾을 수 없습니다."));
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

        if (!(room.getClient().getId().equals(userId) || room.getManager().getId().equals(userId))) {
            throw new GuardianException(HttpStatus.FORBIDDEN, "해당 방 참가자만 삭제할 수 있습니다.");
        }

        chatMessageRepository.deleteByRoomId(roomId);
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
            throw new GuardianException(HttpStatus.FORBIDDEN, "채팅방 참여자만 접근할 수 있습니다.");
        }
    }

    private User getUser(Long userId) {
        return userRepository
                .findById(userId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
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
            case CALL_START -> "화상통화 요청이 도착했습니다.";
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
