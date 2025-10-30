package com.ll.guardian.global.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // ✅ 채팅 관련 경로 모두 인증 없이 허용
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/chat/**",
                                "/ws/**",
                                "/topic/**",
                                "/h2-console/**",
                                "/",
                                "/index.html",
                                "/favicon.ico",
                                "/error",
                                "/html/**", "/chat.html", "/chat"
                        ).permitAll()
                        .anyRequest().permitAll()
                )

                // ✅ CSRF 비활성화 (개발 중 POST 테스트 허용)
                .csrf(csrf -> csrf.disable())

                // ✅ H2 콘솔 iframe 허용 (선택)
                .headers(headers -> headers.frameOptions(frame -> frame.disable()))

                // ✅ 기본 로그인 폼 / HTTP Basic 로그인 둘 다 비활성화
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())

                // ✅ 로그아웃 기능도 비활성화 (원하면 유지)
                .logout(logout -> logout.disable());

        return http.build();
    }
}
