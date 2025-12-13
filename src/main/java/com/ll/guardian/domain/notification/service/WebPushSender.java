package com.ll.guardian.domain.notification.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ll.guardian.domain.notification.entity.WebPushSubscription;
import com.ll.guardian.domain.notification.repository.WebPushSubscriptionRepository;
import com.ll.guardian.global.config.properties.WebPushProperties;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.security.Security;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Utils;
import org.apache.http.HttpResponse;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@Slf4j
public class WebPushSender {

    private final WebPushProperties properties;
    private final ObjectMapper objectMapper;
    private final WebPushSubscriptionRepository subscriptionRepository;
    private PushService pushService;
    private boolean enabled;

    public WebPushSender(
            WebPushProperties properties,
            ObjectMapper objectMapper,
            WebPushSubscriptionRepository subscriptionRepository) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.subscriptionRepository = subscriptionRepository;
        initialize();
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void sendToUser(Long userId, Map<String, Object> payload) {
        if (!enabled) {
            log.debug("Web push disabled. Skipping notification for user {}", userId);
            return;
        }
        List<WebPushSubscription> subscriptions = subscriptionRepository.findByUser_Id(userId);
        subscriptions.forEach(subscription -> send(subscription, payload));
    }

    public void send(WebPushSubscription subscription, Map<String, Object> payload) {
        if (!enabled) {
            log.debug("Web push disabled. Skipping notification for user {}", subscription.getUser().getId());
            return;
        }

        try {
            byte[] body = objectMapper.writeValueAsBytes(payload);
            Notification notification = new Notification(
                    subscription.getEndpoint(), subscription.getP256dh(), subscription.getAuth(), body);
            HttpResponse response = pushService.send(notification);
            int statusCode = response.getStatusLine().getStatusCode();

            if (statusCode >= 200 && statusCode < 300) {
                subscription.touch();
                subscriptionRepository.save(subscription);
                return;
            }

            handleFailureStatus(subscription, statusCode);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("웹 푸시 발송 실패: endpoint={}, reason={}", subscription.getEndpoint(), e.getMessage());
        } catch (IOException
                | GeneralSecurityException
                | org.jose4j.lang.JoseException
                | ExecutionException e) {
            log.warn("웹 푸시 발송 실패: endpoint={}, reason={}", subscription.getEndpoint(), e.getMessage());
        }
    }

    private void handleFailureStatus(WebPushSubscription subscription, int statusCode) {
        if (statusCode == 404 || statusCode == 410) {
            log.info("만료된 구독을 정리합니다. subscriptionId={}, endpoint={}", subscription.getId(), subscription.getEndpoint());
            subscriptionRepository.delete(subscription);
            return;
        }
        log.warn(
                "웹 푸시 발송 실패 - statusCode={}, subscriptionId={}, endpoint={}",
                statusCode,
                subscription.getId(),
                subscription.getEndpoint());
    }

    private void initialize() {
        if (properties == null
                || properties.vapid() == null
                || !StringUtils.hasText(properties.vapid().publicKey())
                || !StringUtils.hasText(properties.vapid().privateKey())) {
            log.warn("웹 푸시 VAPID 키가 설정되지 않아 알림 기능이 비활성화됩니다.");
            this.enabled = false;
            return;
        }

        try {
            if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
                Security.addProvider(new BouncyCastleProvider());
            }
            this.pushService = new PushService();
            pushService.setPublicKey(Utils.loadPublicKey(properties.vapid().publicKey()));
            pushService.setPrivateKey(Utils.loadPrivateKey(properties.vapid().privateKey()));
            pushService.setSubject(
                    StringUtils.hasText(properties.vapid().subject())
                            ? properties.vapid().subject()
                            : "mailto:support@guardian.com");
            this.enabled = true;
        } catch (GeneralSecurityException e) {
            log.error("웹 푸시 서비스 초기화 실패", e);
            this.enabled = false;
        }
    }
}
