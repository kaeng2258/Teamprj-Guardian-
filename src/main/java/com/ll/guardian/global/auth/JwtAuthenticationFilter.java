package com.ll.guardian.global.auth;

import com.ll.guardian.domain.user.entity.User;
import com.ll.guardian.domain.user.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Collection;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(
            JwtTokenProvider jwtTokenProvider,
            UserRepository userRepository
    ) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String token = resolveToken(request);

        if (token != null) {
            try {
                // ✅ 유효하지 않으면 바로 다음 필터로 넘기고 끝
                if (!jwtTokenProvider.validateToken(token)) {
                    filterChain.doFilter(request, response);
                    return;
                }

                // ✅ 여기서 실제로 디코딩
                String email = jwtTokenProvider.getSubject(token);
                String role = jwtTokenProvider.getRole(token); // "ADMIN" / "CLIENT" / "MANAGER"

                if (role == null) {
                    // role 없는 토큰이면(리프레시 토큰 같은) 인증 안 걸고 통과
                    filterChain.doFilter(request, response);
                    return;
                }

                User user = userRepository.findByEmail(email).orElse(null);
                if (user != null) {
                    Collection<? extends GrantedAuthority> authorities =
                            List.of(new SimpleGrantedAuthority(role)); // ⚠️ "ADMIN" 그대로

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(user, null, authorities);

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (Exception e) {
                // 토큰 문제로 예외 터지면 인증 없이 그냥 진행 (403 대신)
                // 필요하면 로그만 남김
                System.out.println("[JwtAuthenticationFilter] JWT 처리 중 오류: " + e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}
