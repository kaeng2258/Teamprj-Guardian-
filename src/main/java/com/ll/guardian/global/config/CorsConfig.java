package com.ll.guardian.global.config;

import java.time.Duration;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;

public final class CorsConfig {

    private CorsConfig() {}
    @Bean
    public static CorsConfiguration defaultConfiguration() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 허용 오리진 (패턴 기반)
        configuration.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "http://127.0.0.1:*",
                "http://192.168.*.*:*",
                "https://localhost:*",
                "https://127.0.0.1:*",
                "https://192.168.*.*:*"
        ));

        // 허용 메서드
        configuration.setAllowedMethods(List.of(
                HttpMethod.GET.name(),
                HttpMethod.POST.name(),
                HttpMethod.PUT.name(),
                HttpMethod.PATCH.name(),
                HttpMethod.DELETE.name(),
                HttpMethod.OPTIONS.name()
        ));

        // 허용 헤더 (현재 필요한 기본 헤더만 지정, 필요시 추가 가능)
        configuration.setAllowedHeaders(List.of(
                HttpHeaders.AUTHORIZATION,
                HttpHeaders.CONTENT_TYPE,
                HttpHeaders.ACCEPT,
                HttpHeaders.ACCEPT_LANGUAGE,
                HttpHeaders.ORIGIN,
                "X-Requested-With"
        ));

        // 클라이언트에서 접근 가능한 노출 헤더
        configuration.setExposedHeaders(List.of(
                HttpHeaders.AUTHORIZATION,
                HttpHeaders.CONTENT_TYPE,
                "Location",
                "Content-Disposition"
        ));

        // 쿠키/세션 기반 인증 허용
        configuration.setAllowCredentials(true);

        // Preflight 캐시 지속시간 (1시간)
        configuration.setMaxAge(Duration.ofHours(1));

        return configuration;
    }
}
