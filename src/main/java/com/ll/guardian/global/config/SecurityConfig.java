package com.ll.guardian.global.config;

import com.ll.guardian.global.auth.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .headers(headers -> headers.frameOptions(frame -> frame.disable()))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        // ✅ 회원가입/이메일중복/로그인/토큰 관련은 모두 허용
                        .requestMatchers(HttpMethod.POST, "/api/users").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/check-email").permitAll()
                        .requestMatchers(
                                "/",
                                "/login",
                                "/error",
                                "/api/auth/**"
                        ).permitAll()

                        // ✅ 관리자: DB / 토큰 / GrantedAuthority 전부 "ADMIN" 으로 통일
                        .requestMatchers("/api/admin/**", "/admin/**")
                        .hasAuthority("ADMIN")

                        // ✅ 관리인: "MANAGER"
                        .requestMatchers("/api/manager/**", "/manager/**")
                        .hasAuthority("MANAGER")

                        // ✅ 환자: "CLIENT"
                        .requestMatchers("/api/client/**", "/client/**")
                        .hasAuthority("CLIENT")

                        // ✅ 웹소켓, H2, 정적 페이지 등 공개
                        .requestMatchers(
                                "/ws/**",
                                "/topic/**",
                                "/h2-console/**",
                                "/index.html",
                                "/favicon.ico",
                                "/templates/**",
                                "/chat.html",
                                "/chat",
                                "/search.html",
                                "/search"
                        ).permitAll()

                        // 나머지는 인증만 되면 OK
                        .anyRequest().authenticated()
                )
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // ✅ CORS
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    // ✅ PasswordEncoder
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
