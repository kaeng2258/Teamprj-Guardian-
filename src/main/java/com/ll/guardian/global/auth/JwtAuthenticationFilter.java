package com.ll.guardian.global.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

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

        // Authorization header
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            // 헤더가 없으면 permitAll 라우트를 위해 그대로 진행
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        // Token exists but invalid -> 401 to trigger refresh/re-login on client
        if (!jwtTokenProvider.isTokenUsable(token)) {
            log.warn("[JwtFilter] invalid token, uri = {}", uri);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        // Extract principal info
        String email = jwtTokenProvider.getSubject(token);   // sub
        String role = jwtTokenProvider.getRole(token);       // "ADMIN" / "CLIENT" / "MANAGER"

        if (email == null) {
            log.warn("[JwtFilter] email is null, uri = {}", uri);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        // Build authorities (role may be null)
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
