package com.ll.guardian.domain.auth.service;

import com.ll.guardian.domain.auth.entity.BlacklistedToken;
import com.ll.guardian.domain.auth.repository.BlacklistedTokenRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class JwtBlacklistService {

    private final BlacklistedTokenRepository blacklistedTokenRepository;

    public JwtBlacklistService(BlacklistedTokenRepository blacklistedTokenRepository) {
        this.blacklistedTokenRepository = blacklistedTokenRepository;
    }

    public void blacklist(String token, LocalDateTime expiresAt) {
        if (token == null || expiresAt == null) {
            return;
        }
        if (expiresAt.isBefore(LocalDateTime.now())) {
            return;
        }
        String hash = hashToken(token);
        if (blacklistedTokenRepository.existsByTokenHash(hash)) {
            return;
        }
        BlacklistedToken saved = BlacklistedToken.builder()
            .tokenHash(hash)
            .expiresAt(expiresAt)
            .build();
        blacklistedTokenRepository.save(saved);
    }

    @Transactional(readOnly = true)
    public boolean isBlacklisted(String token) {
        if (token == null) {
            return false;
        }
        String hash = hashToken(token);
        Optional<BlacklistedToken> found = blacklistedTokenRepository.findByTokenHash(hash);
        if (found.isEmpty()) {
            return false;
        }
        return !found.get().isExpired(LocalDateTime.now());
    }

    public long cleanupExpired() {
        return blacklistedTokenRepository.deleteByExpiresAtBefore(LocalDateTime.now());
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
