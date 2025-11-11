// src/main/java/com/ll/guardian/global/config/SecurityConfig.java
package com.ll.guardian.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // CORS
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // CSRF/프레임옵션(H2 콘솔)
                .csrf(csrf -> csrf.disable())
                .headers(headers -> headers.frameOptions(frame -> frame.disable()))
                // 인가
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
                                "/templates/**",
                                "/chat.html",
                                "/chat",
                                "/search.html",
                                "/search"
                        ).permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .anyRequest().permitAll()
                )
                // 로그인/HTTP Basic/로그아웃 비활성(필요시 활성화)
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .logout(logout -> logout.disable());

        return http.build();
    }

    // ✅ CORS 설정: localhost + LAN IP(https/http) + 기본 메서드/헤더
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        // 오리진
        cfg.addAllowedOriginPattern("http://localhost:*");
        cfg.addAllowedOriginPattern("https://localhost:*");
        cfg.addAllowedOriginPattern("http://127.0.0.1:*");
        cfg.addAllowedOriginPattern("https://127.0.0.1:*");
        cfg.addAllowedOriginPattern("https://192.168.0.7:*"); // 필요 시 IP 수정
        cfg.addAllowedOriginPattern("http://192.168.0.7:*");  // 개발 편의

        // 메서드/헤더
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }

    // ✅ 비밀번호 인코더(권장: DelegatingPasswordEncoder → {bcrypt} 기본)
    @Bean
    public PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    // ✅ 개발용 In-Memory 사용자 (원치 않으면 삭제 가능)
    @Bean
    public UserDetailsService userDetailsService(PasswordEncoder encoder) {
        InMemoryUserDetailsManager manager = new InMemoryUserDetailsManager();
        manager.createUser(
                User.withUsername("guardian")
                        .password(encoder.encode("password123"))
                        .roles("USER")
                        .build()
        );
        return manager;
    }

    // ✅ AuthenticationManager 노출(필요 시 주입해서 사용)
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}
