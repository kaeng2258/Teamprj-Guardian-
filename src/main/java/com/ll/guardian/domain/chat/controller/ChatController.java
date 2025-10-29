package com.ll.guardian.domain.chat.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class SignalingController {


    private final SimpMessagingTemplate messagingTemplate;


    // /app/signal/{roomId} 로 들어온 메시지 → /topic/room/{roomId} 구독자에게 브로드캐스트
    @MessageMapping("/signal/{roomId}")
    public void relay(@DestinationVariable String roomId, @Payload SignalMessage msg) {
        messagingTemplate.convertAndSend("/topic/room/" + roomId, msg);
    }
}