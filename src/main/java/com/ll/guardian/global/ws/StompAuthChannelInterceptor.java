package com.ll.guardian.global.ws;

import com.ll.guardian.global.auth.JwtTokenProvider;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider jwtTokenProvider;
    private final WebSocketSessionRegistry webSocketSessionRegistry;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
            MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null) return message;

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String auth = getFirstNativeHeader(accessor, "Authorization");
            if (auth == null || !auth.startsWith("Bearer ")) {
                throw new IllegalArgumentException("Missing Authorization header");
            }
            String token = auth.substring(7);
            if (!jwtTokenProvider.isTokenUsable(token)) {
                throw new IllegalArgumentException("Invalid token");
            }
            String email = jwtTokenProvider.getSubject(token);
            String role = jwtTokenProvider.getRole(token);

            var authorities = (role == null)
                ? List.<SimpleGrantedAuthority>of()
                : List.of(new SimpleGrantedAuthority(role));
            var authentication = new UsernamePasswordAuthenticationToken(email, null, authorities);

            accessor.setUser(authentication);
            SecurityContextHolder.getContext().setAuthentication(authentication);

            Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
            if (sessionAttributes != null) {
                sessionAttributes.put("token", token);
            }
            if (accessor.getSessionId() != null && email != null) {
                webSocketSessionRegistry.bindUser(accessor.getSessionId(), email);
            }
        }

        if (StompCommand.SEND.equals(accessor.getCommand())
            || StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            String token = resolveToken(accessor);
            if (!jwtTokenProvider.isTokenUsable(token)) {
                webSocketSessionRegistry.closeSession(accessor.getSessionId());
                throw new IllegalArgumentException("Invalid token");
            }
        }

        return message;
    }

    private String getFirstNativeHeader(StompHeaderAccessor accessor, String key) {
        List<String> values = accessor.getNativeHeader(key);
        return (values == null || values.isEmpty()) ? null : values.get(0);
    }

    private String getSessionToken(StompHeaderAccessor accessor) {
        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
        if (sessionAttributes == null) {
            return null;
        }
        Object token = sessionAttributes.get("token");
        return (token instanceof String) ? (String) token : null;
    }

    private String resolveToken(StompHeaderAccessor accessor) {
        String auth = getFirstNativeHeader(accessor, "Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            String headerToken = auth.substring(7);
            if (jwtTokenProvider.isTokenUsable(headerToken)) {
                updateSessionFromToken(accessor, headerToken);
                return headerToken;
            }
        }
        return getSessionToken(accessor);
    }

    private void updateSessionFromToken(StompHeaderAccessor accessor, String token) {
        if (token == null) {
            return;
        }
        String email = jwtTokenProvider.getSubject(token);
        String role = jwtTokenProvider.getRole(token);

        var authorities = (role == null)
            ? List.<SimpleGrantedAuthority>of()
            : List.of(new SimpleGrantedAuthority(role));
        var authentication = new UsernamePasswordAuthenticationToken(email, null, authorities);

        accessor.setUser(authentication);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
        if (sessionAttributes != null) {
            sessionAttributes.put("token", token);
        }
        if (accessor.getSessionId() != null && email != null) {
            webSocketSessionRegistry.bindUser(accessor.getSessionId(), email);
        }
    }
}
