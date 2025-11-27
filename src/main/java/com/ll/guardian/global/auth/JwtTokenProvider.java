package com.ll.guardian.global.auth;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtTokenProvider {

    private final Algorithm algorithm;
    private final Duration accessTokenValidity;
    private final Duration refreshTokenValidity;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-validity}") Duration accessTokenValidity,
            @Value("${jwt.refresh-token-validity}") Duration refreshTokenValidity) {

        this.algorithm = Algorithm.HMAC256(secret);
        this.accessTokenValidity = accessTokenValidity;
        this.refreshTokenValidity = refreshTokenValidity;
    }

    // ------------------------------
    // ⭐ role 있는 토큰 생성
    // ------------------------------

    public String createAccessToken(String email, String role) {
        return createToken(email, role, accessTokenValidity);
    }

    public String createRefreshToken(String email, String role) {
        return createToken(email, role, refreshTokenValidity);
    }

    // ------------------------------
    // ⭐ role 없는 토큰 생성 (호환용)
    // ------------------------------

    public String createAccessToken(String email) {
        return createToken(email, null, accessTokenValidity);
    }

    public String createRefreshToken(String email) {
        return createToken(email, null, refreshTokenValidity);
    }

    // ------------------------------
    // ⭐ 실제 토큰 생성 공통 함수
    // ------------------------------

    private String createToken(String subject, String role, Duration validity) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(validity);

        var builder = JWT.create()
                .withSubject(subject)
                .withIssuedAt(Date.from(now))
                .withExpiresAt(Date.from(expiresAt));

        if (role != null) {
            builder.withClaim("role", role);
        }

        return builder.sign(algorithm);
    }

    public boolean validateToken(String token) {
        try {
            JWT.require(algorithm).build().verify(token);
            return true;
        } catch (JWTVerificationException e) {
            return false;
        }
    }

    public String getSubject(String token) {
        return JWT.require(algorithm).build().verify(token).getSubject();
    }

    public String getRole(String token) {
        return JWT.require(algorithm).build()
                .verify(token)
                .getClaim("role")
                .asString();
    }
}