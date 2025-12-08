package com.ll.guardian.global.config;

import java.time.Duration;
import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;

public final class CorsConfig {

    private CorsConfig() {}

    public static CorsConfiguration defaultConfiguration() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of(
            "http://localhost:*",
            "http://127.0.0.1:*",
            "http://192.168.*.*:*",
            "https://localhost:*",
            "https://127.0.0.1:*",
            "https://192.168.*.*:*",
            "https://prjguardian.com",
            "https://*.prjguardian.com",
            "https://guardianprj.shop",
            "https://*.guardianprj.shop"
        ));
        configuration.setAllowedMethods(List.of(
            HttpMethod.GET.name(),
            HttpMethod.POST.name(),
            HttpMethod.PUT.name(),
            HttpMethod.PATCH.name(),
            HttpMethod.DELETE.name(),
            HttpMethod.OPTIONS.name()
        ));
        configuration.setAllowedHeaders(List.of(
            HttpHeaders.AUTHORIZATION,
            HttpHeaders.CONTENT_TYPE,
            HttpHeaders.ACCEPT,
            HttpHeaders.ACCEPT_LANGUAGE,
            HttpHeaders.ORIGIN,
            "X-Requested-With"
        ));
        configuration.setExposedHeaders(List.of(
            HttpHeaders.AUTHORIZATION,
            HttpHeaders.CONTENT_TYPE,
            "Location",
            "Content-Disposition"
        ));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(Duration.ofHours(1).getSeconds());
        return configuration;
    }

}
