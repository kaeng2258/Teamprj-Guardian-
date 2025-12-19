package com.ll.guardian.domain.auth.service;

import com.ll.guardian.domain.user.repository.UserRepository;
import com.ll.guardian.global.auth.JwtTokenProvider;
import com.ll.guardian.global.exception.GuardianException;
import com.ll.guardian.global.ws.WebSocketSessionRegistry;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class LogoutService {

    private final JwtTokenProvider jwtTokenProvider;
    private final JwtBlacklistService jwtBlacklistService;
    private final WebSocketSessionRegistry webSocketSessionRegistry;
    private final UserRepository userRepository;

    public LogoutService(
        JwtTokenProvider jwtTokenProvider,
        JwtBlacklistService jwtBlacklistService,
        WebSocketSessionRegistry webSocketSessionRegistry,
        UserRepository userRepository
    ) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.jwtBlacklistService = jwtBlacklistService;
        this.webSocketSessionRegistry = webSocketSessionRegistry;
        this.userRepository = userRepository;
    }

    public void logout(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new GuardianException(HttpStatus.UNAUTHORIZED, "Missing authorization token.");
        }
        String token = authorizationHeader.substring(7);
        if (!jwtTokenProvider.validateToken(token)) {
            throw new GuardianException(HttpStatus.UNAUTHORIZED, "Invalid token.");
        }
        String email = jwtTokenProvider.getSubject(token);
        jwtBlacklistService.blacklist(token, jwtTokenProvider.getExpiresAt(token));

        userRepository.findByEmail(email).ifPresent(user -> webSocketSessionRegistry.closeSessionsForUser(user.getEmail()));
    }
}
