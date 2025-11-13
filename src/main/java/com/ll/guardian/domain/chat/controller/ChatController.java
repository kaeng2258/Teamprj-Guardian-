// src/main/java/com/ll/guardian/domain/chat/controller/ChatController.java
package com.ll.guardian.domain.chat.controller;

import com.ll.guardian.domain.chat.dto.ChatMessageRequest;
import com.ll.guardian.domain.chat.dto.ChatMessageResponse;
import com.ll.guardian.domain.chat.dto.ChatThreadResponse;
import com.ll.guardian.domain.chat.service.ChatService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/api/chat", produces = MediaType.APPLICATION_JSON_VALUE)
@CrossOrigin(
        origins = {
                "http://localhost:3000",
                "https://localhost:3000",
                "http://localhost:5173",
                "http://localhost:8081",
                "https://localhost:8081"
        },
        allowCredentials = "true"
)
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    // --- 헬스체크 ---
    @GetMapping
    public String ping() {
        return "chat-api-ok";
    }

    // STOMP 채팅
    @MessageMapping("/signal/{roomId}")
    public void relayChat(@DestinationVariable Long roomId, @Valid @Payload ChatMessageRequest req) {
        ChatMessageRequest fixed = ensureRoomId(req, roomId);
        ChatMessageResponse saved = chatService.sendMessage(fixed);
        // ✅ 실시간 구독자에게 브로드캐스트 (유지)
        messagingTemplate.convertAndSend("/topic/room/" + roomId, saved);
    }

    @GetMapping("/threads")
    public List<ChatThreadResponse> myThreads(@RequestParam @NotNull Long userId) {
        return chatService.getThreadsForUser(userId);
    }

    @GetMapping("/rooms/{roomId}/messages")
    public MessagesResponse getMessages(@PathVariable Long roomId) {
        List<ChatMessageResponse> messages = chatService.getMessages(roomId);
        return new MessagesResponse(messages);
    }

    // 프론트용 래퍼
    public record MessagesResponse(List<ChatMessageResponse> messages) { }


    @PostMapping("/rooms/{roomId}/read")
    public void markRead(@PathVariable Long roomId, @RequestParam @NotNull Long userId) {
        chatService.markThreadAsRead(roomId, userId);
    }

    @PostMapping(value = "/rooms/{roomId}/messages", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ChatMessageResponse sendViaHttp(@PathVariable Long roomId, @RequestBody @Valid ChatMessageRequest req) {
        ChatMessageRequest fixed = ensureRoomId(req, roomId);
        ChatMessageResponse saved = chatService.sendMessage(fixed);

        // ✅ HTTP로 온 메시지도 구독자에게 전파 (상대가 자동으로 보이게)
        messagingTemplate.convertAndSend("/topic/room/" + roomId, saved);

        return saved;
    }

    @PostMapping(value = "/rooms", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ChatThreadResponse openOrGetRoom(@RequestBody @Valid OpenRoomRequest req) {
        return ChatThreadResponse.from(chatService.openOrGetRoom(req.clientId(), req.providerId()));
    }

    @GetMapping("/rooms/{roomId}")
    public ChatThreadResponse getRoom(@PathVariable Long roomId) {
        return ChatThreadResponse.from(chatService.getRoom(roomId));
    }

    @DeleteMapping("/rooms/{roomId}")
    public void deleteRoom(@PathVariable Long roomId, @RequestParam Long userId) {
        chatService.deleteRoom(roomId, userId);
    }

    private ChatMessageRequest ensureRoomId(ChatMessageRequest req, Long roomId) {
        if (req.roomId() == null || !req.roomId().equals(roomId)) {
            return new ChatMessageRequest(
                    roomId,
                    req.senderId(),
                    req.content(),
                    req.messageType(),
                    req.fileUrl()
            );
        }
        return req;
    }

    public record OpenRoomRequest(
            @NotNull Long clientId,
            @NotNull Long providerId
    ) {}

    @MessageMapping("/rtc/{roomId}")
    public void relayRtc(@DestinationVariable Long roomId, @Payload Map<String, Object> payload) {
        messagingTemplate.convertAndSend("/topic/rtc/" + roomId, payload);
    }
}
