package com.ll.guardian.global.security;

import com.ll.guardian.global.config.CorsConfig;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // ✅ CORS 활성화 (아래 corsConfigurationSource() 빈을 사용)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

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
                        .anyRequest().permitAll()
                )
                .csrf(csrf -> csrf.disable())
                .headers(headers -> headers.frameOptions(frame -> frame.disable()))
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .logout(logout -> logout.disable());

        return http.build();
    }

    // ✅ LAN IP(HTTPS)까지 허용하는 CORS 소스 등록
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = CorsConfig.defaultConfiguration();

        // 기본은 http://localhost:* 만 포함돼 있음 → LAN IP의 HTTPS 오리진을 추가
        cfg.addAllowedOriginPattern("https://192.168.0.7:*"); // 포트 8081/8443 모두 허용
        cfg.addAllowedOriginPattern("http://192.168.0.7:*");  // 필요 시(개발 중) 임시 허용

        // (선택) 메서드/헤더가 부족하다면 추가
        cfg.addAllowedMethod(HttpMethod.HEAD);
        cfg.addAllowedHeader("*");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }
}
