package com.ll.guardian.global.auth;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.ll.guardian.domain.auth.service.JwtBlacklistService;
import jakarta.annotation.PostConstruct;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtTokenProvider {

    private static final String CLAIM_TYPE = "type";
    private static final String CLAIM_ROLE = "role";
    private static final String TYPE_ACCESS = "access";
    private static final String TYPE_REFRESH = "refresh";

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

    public String createAccessToken(String subject, String role) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(accessTokenValidity);
        return JWT.create()
                .withSubject(subject)
                .withIssuedAt(Date.from(now))
                .withExpiresAt(Date.from(expiresAt))
                .withClaim(CLAIM_TYPE, TYPE_ACCESS)
                .withClaim(CLAIM_ROLE, role)
                .sign(algorithm);
    }

    public String createRefreshToken(String subject) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(refreshTokenValidity);
        return JWT.create()
                .withSubject(subject)
                .withIssuedAt(Date.from(now))
                .withExpiresAt(Date.from(expiresAt))
                .withJWTId(UUID.randomUUID().toString())
                .withClaim(CLAIM_TYPE, TYPE_REFRESH)
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

    public String getRole(String token) {
        return JWT.require(algorithm).build().verify(token).getClaim(CLAIM_ROLE).asString();
    }
}
