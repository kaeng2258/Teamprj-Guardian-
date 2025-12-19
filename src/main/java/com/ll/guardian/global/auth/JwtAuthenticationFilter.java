package com.ll.guardian.global.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String uri = request.getRequestURI();

        // 🔎 Authorization 헤더 꺼내기
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            // 토큰이 없으면 그냥 다음 필터로
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        // 🔎 토큰 유효성 검증 + 블랙리스트 확인
        if (!jwtTokenProvider.isTokenUsable(token)) {
            log.warn("[JwtFilter] invalid token, uri = {}", uri);
            filterChain.doFilter(request, response);
            return;
        }

        // 🔎 토큰에서 이메일 / 역할 꺼내기
        String email = jwtTokenProvider.getSubject(token);   // sub
        String role = jwtTokenProvider.getRole(token);       // "ADMIN" / "CLIENT" / "MANAGER"

        if (email == null) {
            log.warn("[JwtFilter] email is null, uri = {}", uri);
            filterChain.doFilter(request, response);
            return;
        }

        // ✅ role 클레임이 없는 레거시 토큰도 허용
        List<GrantedAuthority> authorities = (role == null)
            ? List.of()
            : List.of(new SimpleGrantedAuthority(role));

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(email, null, authorities);

        authentication.setDetails(
                new WebAuthenticationDetailsSource().buildDetails(request)
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        log.info("[JwtFilter] uri = {}, email = {}, role = {}", uri, email, role);

        filterChain.doFilter(request, response);
    }
}
