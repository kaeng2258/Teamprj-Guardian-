package com.ll.guardian.domain.edrug.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "mfds.api")
public record EasyDrugProperties(
        String baseUrl,         // 예: https://apis.data.go.kr/1471000/DrbEasyDrugInfoService
        String serviceKey,      // 시크릿에서 주입
        Integer connectTimeoutMs,
        Integer readTimeoutMs
) {}
