package com.ll.guardian.domain.notification.controller;

import com.ll.guardian.domain.notification.dto.WebPushConfigResponse;
import com.ll.guardian.domain.notification.service.WebPushSender;
import com.ll.guardian.global.config.properties.WebPushProperties;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/push")
public class WebPushConfigController {

    private final WebPushSender webPushSender;
    private final WebPushProperties webPushProperties;

    public WebPushConfigController(WebPushSender webPushSender, WebPushProperties webPushProperties) {
        this.webPushSender = webPushSender;
        this.webPushProperties = webPushProperties;
    }

    @GetMapping("/config")
    public ResponseEntity<WebPushConfigResponse> getConfig() {
        String publicKey = extractPublicKey();
        boolean enabled = webPushSender.isEnabled() && StringUtils.hasText(publicKey);
        return ResponseEntity.ok(new WebPushConfigResponse(enabled, enabled ? publicKey : ""));
    }

    private String extractPublicKey() {
        if (webPushProperties == null || webPushProperties.vapid() == null) {
            return "";
        }
        return webPushProperties.vapid().publicKey();
    }
}
