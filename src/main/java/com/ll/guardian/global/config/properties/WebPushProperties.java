package com.ll.guardian.global.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "webpush")
public record WebPushProperties(Vapid vapid, Scheduler scheduler) {

    public record Vapid(String publicKey, String privateKey, String subject) {}

    public record Scheduler(String timezone) {}
}
