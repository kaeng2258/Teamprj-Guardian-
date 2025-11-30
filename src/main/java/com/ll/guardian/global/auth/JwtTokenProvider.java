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
            // yml 에 값이 없어도 기본값 들어가게 디폴트 지정
            @Value("${jwt.access-token-validity:PT30M}") Duration accessTokenValidity,
            @Value("${jwt.refresh-token-validity:P7D}") Duration refreshTokenValidity
    ) {
        this.algorithm = Algorithm.HMAC256(secret);
        this.verifier = JWT.require(algorithm).build();

        // ⚠ yml에서 이상한 값이 오더라도, 최소 5분/1일은 보장하도록 강제
        Duration minAccess = Duration.ofMinutes(5);
        Duration minRefresh = Duration.ofDays(1);

        // access token 유효기간
        if (accessTokenValidity == null || accessTokenValidity.isZero() || accessTokenValidity.isNegative()) {
            this.accessTokenValidity = Duration.ofMinutes(30);   // 기본 30분
        } else if (accessTokenValidity.compareTo(minAccess) < 0) {
            this.accessTokenValidity = minAccess;                // 너무 짧으면 5분으로 올려버리기
        } else {
            this.accessTokenValidity = accessTokenValidity;
        }

        // refresh token 유효기간
        if (refreshTokenValidity == null || refreshTokenValidity.isZero() || refreshTokenValidity.isNegative()) {
            this.refreshTokenValidity = Duration.ofDays(7);      // 기본 7일
        } else if (refreshTokenValidity.compareTo(minRefresh) < 0) {
            this.refreshTokenValidity = minRefresh;              // 최소 1일
        } else {
            this.refreshTokenValidity = refreshTokenValidity;
        }

        System.out.println("[JwtTokenProvider] accessTokenValidity = " + this.accessTokenValidity);
        System.out.println("[JwtTokenProvider] refreshTokenValidity = " + this.refreshTokenValidity);
    }

    // 나머지 메서드는 그대로
    public String createAccessToken(String email, String role) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(accessTokenValidity);

        return JWT.create()
                .withSubject(email)
                .withClaim("role", role)
                .withIssuedAt(Date.from(now))
                .withExpiresAt(Date.from(expiresAt))
                .sign(algorithm);
    }

    public String createRefreshToken(String email) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(refreshTokenValidity);

        return JWT.create()
                .withSubject(email)
                .withIssuedAt(Date.from(now))
                .withExpiresAt(Date.from(expiresAt))
                .sign(algorithm);
    }

    public String createRefreshToken(String email, String role) {
        return createRefreshToken(email);
    }

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

    public String getRole(String token) {
        DecodedJWT jwt = verifier.verify(token);
        String role = jwt.getClaim("role").asString();
        if (role == null) return null;
        return role.trim().toUpperCase();
    }
}
