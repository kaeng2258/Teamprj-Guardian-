package com.ll.guardian.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(
                        "http://localhost:*",
                        "http://127.0.0.1:*",
                        "http://192.168.*.*:*",
                        "https://localhost:*",
                        "https://127.0.0.1:*",
                        "https://192.168.*.*:*"
                )
                .withSockJS();
    }

    /**
     * /app/** 로 들어오는 메시지는 @MessageMapping 으로 라우팅
     * /topic/**, /queue/** 는 브로커로 라우팅
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/app");
        registry.enableSimpleBroker("/topic", "/queue");
        // 사용자 큐를 쓰면 아래도 사용 가능
        // registry.setUserDestinationPrefix("/user");
    }
}