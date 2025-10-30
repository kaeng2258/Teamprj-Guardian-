package com.ll.guardian.global.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // ⬇️ 채팅 API & 웹소켓 허용
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/chat/**").permitAll()
                        .requestMatchers("/ws/**").permitAll()      // SockJS/STOMP 엔드포인트
                        .requestMatchers("/topic/**").permitAll()   // 메세지 브로커 경로(핸드셰이크는 아님)
                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers("/", "/index.html", "/favicon.ico", "/error").permitAll()
                        .anyRequest().authenticated()
                )

                // ⬇️ CSRF: 채팅 REST & WS는 제외(POST 테스트용)
                .csrf(csrf -> csrf
                        .ignoringRequestMatchers(
                                new AntPathRequestMatcher("/api/chat/**"),
                                new AntPathRequestMatcher("/ws/**"),
                                new AntPathRequestMatcher("/h2-console/**")
                        )
                )

                // ⬇️ H2 콘솔 보려고 frameOptions 해제(선택)
                .headers(headers -> headers.frameOptions(frame -> frame.disable()))

                // ⬇️ 폼로그인 대신 httpBasic로 간단 테스트(원하면 유지/삭제)
                .httpBasic(Customizer.withDefaults())
                .formLogin(login -> login.disable())

                // ⬇️ 로그아웃 필요 없으면 비활성(선택)
                .logout(logout -> logout.disable());

        return http.build();
    }
}