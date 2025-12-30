package com.ll.guardian.global.config;

import com.ll.guardian.global.ws.StompAuthChannelInterceptor;
import com.ll.guardian.global.ws.WebSocketSessionRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;
import org.springframework.web.socket.handler.WebSocketHandlerDecorator;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final StompAuthChannelInterceptor stompAuthChannelInterceptor;
    private final WebSocketSessionRegistry webSocketSessionRegistry;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-stomp")
            .setAllowedOriginPatterns(
                "http://localhost:*",
                "http://127.0.0.1:*",
                "http://192.168.*.*:*",
                "https://localhost:*",
                "https://127.0.0.1:*",
                "https://192.168.*.*:*",
                "https://prjguardian.com",
                "https://*.prjguardian.com",
                "https://guardianprj.shop",
                "https://*.guardianprj.shop"
            )
            .withSockJS();

    }

    /**
     * ✅ (핵심) STOMP inbound(클라이언트 → 서버) 채널에 인터셉터 등록
     * - CONNECT 프레임의 Authorization 헤더를 읽어서 Principal 세팅
     * - 이후 @MessageMapping 메서드에서 Principal 사용 가능
     */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(stompAuthChannelInterceptor);
    }

    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registry) {
        registry.addDecoratorFactory(handler -> new WebSocketHandlerDecorator(handler) {
            @Override
            public void afterConnectionEstablished(org.springframework.web.socket.WebSocketSession session)
                throws Exception {
                webSocketSessionRegistry.registerSession(session);
                super.afterConnectionEstablished(session);
            }

            @Override
            public void afterConnectionClosed(org.springframework.web.socket.WebSocketSession session, CloseStatus status)
                throws Exception {
                webSocketSessionRegistry.unregisterSession(session.getId());
                super.afterConnectionClosed(session, status);
            }
        });
    }

    /**
     * /app/** 로 들어오는 메시지는 @MessageMapping 으로 라우팅
     * /topic/**, /queue/** 는 브로커로 라우팅
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/app");
        registry.enableSimpleBroker("/topic", "/queue")
                .setTaskScheduler(heartbeatScheduler())
                .setHeartbeatValue(new long[]{10000, 10000});
    }

    @Bean
    public TaskScheduler heartbeatScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("wss-heartbeat-");
        scheduler.initialize();
        return scheduler;
    }
}
