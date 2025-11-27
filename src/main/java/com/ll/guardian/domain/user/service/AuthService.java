
package com.ll.guardian.domain.user.service;

import com.ll.guardian.domain.auth.entity.RefreshToken;
import com.ll.guardian.domain.auth.service.RefreshTokenService;
import com.ll.guardian.domain.user.UserRole;
import com.ll.guardian.domain.user.UserStatus;
import com.ll.guardian.domain.user.dto.LoginRequest;
import com.ll.guardian.domain.user.dto.LoginResponse;
import com.ll.guardian.domain.user.dto.RefreshTokenRequest;
import com.ll.guardian.domain.user.dto.RefreshTokenResponse;
import com.ll.guardian.domain.user.entity.User;
import com.ll.guardian.domain.user.repository.UserRepository;
import com.ll.guardian.global.auth.JwtTokenProvider;
import com.ll.guardian.global.exception.GuardianException;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final Duration refreshTokenValidity;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider,
            RefreshTokenService refreshTokenService,
            @Value("${jwt.refresh-token-validity}") Duration refreshTokenValidity) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.refreshTokenService = refreshTokenService;
        this.refreshTokenValidity = refreshTokenValidity;
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository
                .findByEmail(request.email())
                .orElseThrow(() -> new GuardianException(HttpStatus.UNAUTHORIZED, "계정을 찾을 수 없습니다."));

        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new GuardianException(HttpStatus.UNAUTHORIZED, "정지된 계정입니다.");
        }

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new GuardianException(HttpStatus.UNAUTHORIZED, "비밀번호가 올바르지 않습니다.");
        }

        String accessToken = jwtTokenProvider.createAccessToken(
                user.getEmail(),
                user.getRole().name()   // ⭐ 스프링 권한 규칙에 맞게
        );

        String refreshTokenValue = jwtTokenProvider.createRefreshToken(
                user.getEmail(),
                user.getRole().name()
        );
        RefreshToken refreshToken = refreshTokenService.issue(user, refreshTokenValue, refreshTokenValidity);

        return new LoginResponse(
                user.getId(),
                user.getRole(),
                accessToken,
                refreshToken.getToken(),
                resolveRedirectPath(user.getRole()));
    }

    public RefreshTokenResponse refresh(RefreshTokenRequest request) {
        // 1. 전달받은 리프레시 토큰이 유효한지 검증
        RefreshToken refreshToken = refreshTokenService.getValidToken(request.refreshToken());

        // 2. 유저 정보 꺼내기
        var user = refreshToken.getUser();
        String email = user.getEmail();
        String role = user.getRole().name(); // "ADMIN" / "CLIENT" / "MANAGER"

        // 3. role까지 넣어서 새 액세스 토큰 발급
        String newAccessToken = jwtTokenProvider.createAccessToken(email, role);

        // 4. 새 리프레시 토큰 발급 (role을 안 쓸 거면 email만 써도 됨)
        String newRefreshToken = jwtTokenProvider.createRefreshToken(email);

        // 5. 리프레시 토큰 엔티티 재발급/저장
        RefreshToken reissued =
                refreshTokenService.issue(user, newRefreshToken, refreshTokenValidity);

        // 6. 응답 DTO 리턴
        return new RefreshTokenResponse(newAccessToken, reissued.getToken());
    }


    private String resolveRedirectPath(UserRole role) {
        return switch (role) {
            case CLIENT -> "/client/mypage";
            case MANAGER -> "/manager/mypage";
            case ADMIN -> "/admin";
        };
    }

}
