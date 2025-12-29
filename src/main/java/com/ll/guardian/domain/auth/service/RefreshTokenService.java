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
        LocalDateTime expiresAt = LocalDateTime.now().plus(validity);
        return refreshTokenRepository.findByUserIdForUpdate(user.getId())
                .map(existing -> {
                    existing.updateToken(token, expiresAt);
                    return existing;
                })
                .orElseGet(() -> refreshTokenRepository.save(
                        RefreshToken.builder()
                                .user(user)
                                .token(token)
                                .expiresAt(expiresAt)
                                .build()
                ));
    }

    public RefreshToken getValidToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByTokenForUpdate(token)
                .orElseThrow(() -> new GuardianException(HttpStatus.UNAUTHORIZED, "?좏슚?섏? ?딆? ?좏겙?낅땲??"));
        if (refreshToken.isExpired(LocalDateTime.now())) {
            throw new GuardianException(HttpStatus.UNAUTHORIZED, "留뚮즺???좏겙?낅땲??");
        }
        return refreshToken;
    }
}
