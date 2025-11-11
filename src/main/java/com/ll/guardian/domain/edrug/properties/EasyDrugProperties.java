package com.ll.guardian.domain.edrug.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "mfds.easydrug")
public record EasyDrugProperties(
        String baseUrl,
        String serviceKey,
        Integer timeoutMs) {}
