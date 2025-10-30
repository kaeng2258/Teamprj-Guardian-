package com.ll.guardian.domain.chat.controller;

import com.ll.guardian.domain.chat.dto.ChatMessageRequest;
import com.ll.guardian.domain.chat.dto.ChatMessageResponse;
import com.ll.guardian.domain.chat.dto.ChatThreadResponse;
import com.ll.guardian.domain.chat.service.ChatService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    // =======================
    // STOMP (웹소켓)
    // 클라이언트 전송: /app/signal/{roomId}
    // 서버 브로드캐스트: /topic/room/{roomId}
    // =======================
    @MessageMapping("/signal/{roomId}")
    public void relay(@DestinationVariable Long roomId, @Valid @Payload ChatMessageRequest req) {
        // body의 roomId가 비었거나 경로변수와 다를 수 있으므로 고정
        ChatMessageRequest fixed = ensureRoomId(req, roomId);

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
    @PostMapping("/rooms/{roomId}/messages")
    public ChatMessageResponse sendViaHttp(
            @PathVariable Long roomId,
            @RequestBody @Valid ChatMessageRequest req
    ) {
        ChatMessageRequest fixed = ensureRoomId(req, roomId);
        ChatMessageResponse saved = chatService.sendMessage(fixed);

        // REST로 보낸 것도 실시간 구독자에게 브로드캐스트 (선택사항이지만 UX 좋음)
        messagingTemplate.convertAndSend("/topic/room/" + roomId, saved);
        return saved;
    }

    // =======================
    // 유틸
    // =======================
    private ChatMessageRequest ensureRoomId(ChatMessageRequest req, Long roomId) {
        if (req.roomId() != null && !req.roomId().equals(roomId)) {
            // 경로변수와 바디 roomId 불일치 방지
            return new ChatMessageRequest(
                    roomId,
                    req.senderId(),
                    req.content(),
                    req.messageType(),
                    req.fileUrl()
            );
        }
        if (req.roomId() == null) {
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

    // (추가) 방 개설/획득
    @PostMapping("/rooms")
    public ChatThreadResponse openOrGetRoom(@RequestBody OpenRoomRequest req) {
        return ChatThreadResponse.from(
                chatService.openOrGetRoom(req.clientId(), req.providerId())
        );
    }

    // (추가) 단일 방 조회
    @GetMapping("/rooms/{roomId}")
    public ChatThreadResponse getRoom(@PathVariable Long roomId) {
        return ChatThreadResponse.from(chatService.getRoom(roomId));
    }

    // OpenRoomRequest DTO (컨트롤러 내부에 record로 두어도 되고, 별도 파일로 빼도 됩니다)
    public record OpenRoomRequest(Long clientId, Long providerId) {}

}
