// src/main/java/com/ll/guardian/domain/chat/controller/ChatController.java
package com.ll.guardian.domain.chat.controller;

import com.ll.guardian.domain.chat.dto.ChatMessageRequest;
import com.ll.guardian.domain.chat.dto.ChatMessageResponse;
import com.ll.guardian.domain.chat.dto.ChatThreadResponse;
import com.ll.guardian.domain.chat.service.ChatService;
import com.ll.guardian.global.exception.GuardianException;
import com.ll.guardian.global.ws.WebSocketSessionRegistry;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
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
    private final WebSocketSessionRegistry webSocketSessionRegistry;

    // --- 헬스체크 ---
    @GetMapping
    public String ping() {
        return "chat-api-ok";
    }

    // STOMP 채팅
    @MessageMapping("/signal/{roomId}")
    public void relayChat(
        @DestinationVariable Long roomId,
        @Valid @Payload ChatMessageRequest req,
        Principal principal
    ) {
        Long senderId = chatService.getUserIdByEmail(requirePrincipal(principal));
        ChatMessageRequest fixed = new ChatMessageRequest(
            roomId,
            senderId,
            req.content(),
            req.messageType(),
            req.fileUrl()
        );
        ChatMessageResponse saved = chatService.sendMessage(fixed);
        messagingTemplate.convertAndSend("/topic/room/" + roomId, saved);
    }

    @GetMapping("/threads")
    public List<ChatThreadResponse> myThreads(@RequestParam @NotNull Long userId) {
        return chatService.getThreadsForUser(userId);
    }

    @GetMapping("/rooms/{roomId}/messages")
    public MessagesResponse getMessages(@PathVariable Long roomId, Principal principal) {
        Long userId = chatService.getUserIdByEmail(requirePrincipal(principal));
        List<ChatMessageResponse> messages = chatService.getMessages(roomId, userId);
        return new MessagesResponse(messages);
    }

    public record MessagesResponse(List<ChatMessageResponse> messages) {}

    @PostMapping("/rooms/{roomId}/read")
    public void markRead(
        @PathVariable Long roomId,
        @RequestParam(required = false) Long userId,
        Principal principal
    ) {
        Long resolvedUserId = chatService.getUserIdByEmail(requirePrincipal(principal));
        if (userId != null && !userId.equals(resolvedUserId)) {
            throw new GuardianException(HttpStatus.FORBIDDEN, "요청 사용자와 인증 정보가 일치하지 않습니다.");
        }
        chatService.markThreadAsRead(roomId, resolvedUserId);
    }

    @PostMapping(value = "/rooms/{roomId}/messages", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ChatMessageResponse sendViaHttp(
        @PathVariable Long roomId,
        Principal principal,
        @RequestBody @Valid ChatMessageRequest req
    ) {
        Long senderId = chatService.getUserIdByEmail(requirePrincipal(principal));
        ChatMessageRequest fixed = new ChatMessageRequest(
            roomId,
            senderId,
            req.content(),
            req.messageType(),
            req.fileUrl()
        );
        ChatMessageResponse saved = chatService.sendMessage(fixed);
        messagingTemplate.convertAndSend("/topic/room/" + roomId, saved);
        return saved;
    }

    @PostMapping(value = "/rooms", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ChatThreadResponse openOrGetRoom(@RequestBody @Valid OpenRoomRequest req) {
        return ChatThreadResponse.from(chatService.openOrGetRoom(req.clientId(), req.managerId()));
    }

    @GetMapping("/rooms/{roomId}")
    public ChatThreadResponse getRoom(@PathVariable Long roomId, Principal principal) {
        Long userId = chatService.getUserIdByEmail(requirePrincipal(principal));
        chatService.assertParticipant(roomId, userId);
        return ChatThreadResponse.from(chatService.getRoom(roomId));
    }

    @DeleteMapping("/rooms/{roomId}")
    public void deleteRoom(
        @PathVariable Long roomId,
        @RequestParam(required = false) Long userId,
        Principal principal
    ) {
        Long resolvedUserId = chatService.getUserIdByEmail(requirePrincipal(principal));
        if (userId != null && !userId.equals(resolvedUserId)) {
            throw new GuardianException(HttpStatus.FORBIDDEN, "요청 사용자와 인증 정보가 일치하지 않습니다.");
        }
        chatService.deleteRoom(roomId, resolvedUserId);
    }

    public record OpenRoomRequest(
            @NotNull Long clientId,
            @NotNull Long managerId
    ) {}

    @MessageMapping("/rtc/{roomId}")
    public void relayRtc(
        @DestinationVariable Long roomId,
        @Payload Map<String, Object> payload,
        Principal principal
    ) {
        Long userId = chatService.getUserIdByEmail(requirePrincipal(principal));
        chatService.assertParticipant(roomId, userId);
        messagingTemplate.convertAndSend("/topic/rtc/" + roomId, payload);
    }

    private String requirePrincipal(Principal principal) {
        if (principal == null || principal.getName() == null) {
            throw new GuardianException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return principal.getName();
    }
}
