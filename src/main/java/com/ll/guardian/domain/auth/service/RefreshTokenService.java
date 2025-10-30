package com.ll.guardian.domain.auth.service;

import com.ll.guardian.domain.auth.entity.RefreshToken;
import com.ll.guardian.domain.auth.repository.RefreshTokenRepository;
import com.ll.guardian.domain.user.entity.User;
import com.ll.guardian.global.exception.GuardianException;
import java.time.Duration;
import java.time.LocalDateTime;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    public RefreshToken issue(User user, String token, Duration validity) {
        refreshTokenRepository.deleteByUserId(user.getId());
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(token)
                .expiresAt(LocalDateTime.now().plus(validity))
                .build();
        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional(readOnly = true)
    public RefreshToken getValidToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new GuardianException(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다."));
        if (refreshToken.isExpired(LocalDateTime.now())) {
            throw new GuardianException(HttpStatus.UNAUTHORIZED, "만료된 토큰입니다.");
        }
        return refreshToken;
    }
}
