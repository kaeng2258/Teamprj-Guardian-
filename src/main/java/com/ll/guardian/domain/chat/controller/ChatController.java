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

@Slf4j
@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/api/chat", produces = MediaType.APPLICATION_JSON_VALUE)
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "http://localhost:8081"}, allowCredentials = "true")
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    // =======================
    // 헬스체크(핑)
    // =======================
    @GetMapping
    public String ping() {
        return "chat-api-ok";
    }

    // =======================
    // STOMP (웹소켓)
    // 클라이언트 전송: /app/signal/{roomId}
    // 서버 브로드캐스트: /topic/room/{roomId}
    // =======================
    @MessageMapping("/signal/{roomId}")
    public void relay(@DestinationVariable Long roomId, @Valid @Payload ChatMessageRequest req) {
        ChatMessageRequest fixed = ensureRoomId(req, roomId);
        log.debug("[STOMP] recv room={}, sender={}, type={}, content={}",
                roomId, fixed.senderId(), fixed.messageType(), fixed.content());

        ChatMessageResponse saved = chatService.sendMessage(fixed);
        messagingTemplate.convertAndSend("/topic/room/" + roomId, saved);
    }

    // =======================
    // REST API
    // =======================

    /** 내가 속한 스레드(채팅방 목록) */
    @GetMapping("/threads")
    public List<ChatThreadResponse> myThreads(@RequestParam @NotNull Long userId) {
        return chatService.getThreadsForUser(userId);
    }

    /** 특정 방 메시지 전부(오름차순) */
    @GetMapping("/rooms/{roomId}/messages")
    public List<ChatMessageResponse> getMessages(@PathVariable Long roomId) {
        return chatService.getMessages(roomId);
    }

    /** 특정 방 읽음 처리 */
    @PostMapping("/rooms/{roomId}/read")
    public void markRead(@PathVariable Long roomId, @RequestParam @NotNull Long userId) {
        chatService.markThreadAsRead(roomId, userId);
    }

    /** HTTP로 메시지 전송 (웹소켓 없이 REST로도 보낼 수 있게) */
    @PostMapping(value = "/rooms/{roomId}/messages", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ChatMessageResponse sendViaHttp(@PathVariable Long roomId, @RequestBody @Valid ChatMessageRequest req) {
        ChatMessageRequest fixed = ensureRoomId(req, roomId);
        ChatMessageResponse saved = chatService.sendMessage(fixed);
        // 실시간 구독자에게도 브로드캐스트
        messagingTemplate.convertAndSend("/topic/room/" + roomId, saved);
        return saved;
    }

    /** 방 개설/획득 */
    @PostMapping(value = "/rooms", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ChatThreadResponse openOrGetRoom(@RequestBody @Valid OpenRoomRequest req) {
        return ChatThreadResponse.from(chatService.openOrGetRoom(req.clientId(), req.providerId()));
    }

    /** 단일 방 조회 */
    @GetMapping("/rooms/{roomId}")
    public ChatThreadResponse getRoom(@PathVariable Long roomId) {
        return ChatThreadResponse.from(chatService.getRoom(roomId));
    }

    // =======================
    // 유틸
    // =======================
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

    // 요청 DTO
    public record OpenRoomRequest(
            @NotNull Long clientId,
            @NotNull Long providerId
    ) {}
}
