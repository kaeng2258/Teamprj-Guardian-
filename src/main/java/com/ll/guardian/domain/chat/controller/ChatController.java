package com.ll.guardian.domain.chat.controller;

import com.ll.guardian.domain.chat.entity.ChatMessage;
import com.ll.guardian.domain.chat.entity.ChatRoom;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ChatController {


    private final SimpMessagingTemplate messagingTemplate;


    // /app/signal/{roomId} 로 들어온 메시지 → /topic/room/{roomId} 구독자에게 브로드캐스트
    @MessageMapping("/signal/{roomId}")
    public void relay(@DestinationVariable ChatRoom roomId, @Payload ChatMessage msg) {
        messagingTemplate.convertAndSend("/topic/room/" + roomId, msg);
    }
}