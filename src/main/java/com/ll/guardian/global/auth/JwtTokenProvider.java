package com.ll.guardian.global.auth;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtTokenProvider {

    private final Algorithm algorithm;
    private final JWTVerifier verifier;
    private final Duration accessTokenValidity;
    private final Duration refreshTokenValidity;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-validity}") Duration accessTokenValidity,
            @Value("${jwt.refresh-token-validity}") Duration refreshTokenValidity
    ) {
        this.algorithm = Algorithm.HMAC256(secret);
        this.verifier = JWT.require(algorithm).build();
        this.accessTokenValidity = accessTokenValidity;
        this.refreshTokenValidity = refreshTokenValidity;
    }


    // 액세스 토큰: email + role("ADMIN" / "CLIENT" / "MANAGER")
    public String createAccessToken(String email, String role) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(accessTokenValidity);

        return JWT.create()
                .withSubject(email)
                .withClaim("role", role)  // 여기엔 "ADMIN" 그대로만 들어간다
                .withIssuedAt(Date.from(now))
                .withExpiresAt(Date.from(expiresAt))
                .sign(algorithm);
    }

    // 리프레시 토큰(역할 안 써도 됨)
    public String createRefreshToken(String email) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(refreshTokenValidity);

        return JWT.create()
                .withSubject(email)
                .withIssuedAt(Date.from(now))
                .withExpiresAt(Date.from(expiresAt))
                .sign(algorithm);
    }

    // 기존 코드 호환용 (email, role) 시그니처 버전
    public String createRefreshToken(String email, String role) {
        return createRefreshToken(email);
    }

    // 토큰 검증
    public boolean validateToken(String token) {
        try {
            verifier.verify(token);
            return true;
        } catch (JWTVerificationException ex) {
            System.out.println("[JwtTokenProvider] invalid token: " + ex.getMessage());
            return false;
        }
    }

    public String getSubject(String token) {
        DecodedJWT jwt = verifier.verify(token);
        return jwt.getSubject();
    }

    // "ADMIN" / "CLIENT" / "MANAGER" 반환
    public String getRole(String token) {
        DecodedJWT jwt = verifier.verify(token);
        String role = jwt.getClaim("role").asString();
        if (role == null) return null;
        return role.trim().toUpperCase();
    }
}
