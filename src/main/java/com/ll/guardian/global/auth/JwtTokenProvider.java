package com.ll.guardian.global.auth;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.ll.guardian.domain.auth.service.JwtBlacklistService;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.UUID;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secret;
    private Algorithm algorithm;
    private final Duration accessTokenValidity;
    private final Duration refreshTokenValidity;
    private final JwtBlacklistService jwtBlacklistService;

    public JwtTokenProvider(
            @Value("${jwt.access-token-validity}") Duration accessTokenValidity,
            @Value("${jwt.refresh-token-validity}") Duration refreshTokenValidity,
            JwtBlacklistService jwtBlacklistService) {
        this.accessTokenValidity = accessTokenValidity;
        this.refreshTokenValidity = refreshTokenValidity;
        this.jwtBlacklistService = jwtBlacklistService;
    }

    @PostConstruct
    public void init() {
        this.algorithm = Algorithm.HMAC256(secret);
    }

    public String createAccessToken(String subject) {
        return createToken(subject, accessTokenValidity);
    }

    public String createRefreshToken(String subject) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(refreshTokenValidity);
        return JWT.create()
                .withSubject(subject)
                .withIssuedAt(Date.from(now))
                .withExpiresAt(Date.from(expiresAt))
                .withJWTId(UUID.randomUUID().toString())
                .withClaim("type", "refresh")
                .sign(algorithm);
    }

    private String createToken(String subject, Duration validity) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(validity);
        return JWT.create()
                .withSubject(subject)
                .withIssuedAt(Date.from(now))
                .withExpiresAt(Date.from(expiresAt))
                .sign(algorithm);
    }

    public boolean validateToken(String token) {
        try {
            JWT.require(algorithm).build().verify(token);
            return true;
        } catch (JWTVerificationException e) {
            return false;
        }
    }

    public boolean isTokenUsable(String token) {
        return validateToken(token) && !jwtBlacklistService.isBlacklisted(token);
    }

    public String getSubject(String token) {
        return JWT.require(algorithm).build().verify(token).getSubject();
    }

    public LocalDateTime getExpiresAt(String token) {
        Date expiresAt = JWT.require(algorithm).build().verify(token).getExpiresAt();
        return LocalDateTime.ofInstant(expiresAt.toInstant(), ZoneId.systemDefault());
    }

    // 레거시 토큰에는 role 클레임이 없으므로 null 리턴
    public String getRole(String token) {
        return null;
    }
}
