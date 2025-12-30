package com.ll.guardian.domain.notification.service;

import com.ll.guardian.domain.notification.dto.WebPushSubscriptionRequest;
import com.ll.guardian.domain.notification.dto.WebPushSubscriptionResponse;
import com.ll.guardian.domain.notification.entity.WebPushSubscription;
import com.ll.guardian.domain.notification.repository.WebPushSubscriptionRepository;
import com.ll.guardian.domain.user.entity.User;
import com.ll.guardian.domain.user.repository.UserRepository;
import com.ll.guardian.global.exception.GuardianException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class WebPushSubscriptionService {

    private final WebPushSubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;

    public WebPushSubscriptionService(
            WebPushSubscriptionRepository subscriptionRepository, UserRepository userRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
    }

    public WebPushSubscriptionResponse subscribe(Long userId, WebPushSubscriptionRequest request) {
        User user = getUser(userId);
        WebPushSubscription subscription = subscriptionRepository
                .findByEndpoint(request.endpoint())
                .orElseGet(() -> WebPushSubscription.builder().endpoint(request.endpoint()).build());

        subscription.assignUser(user);
        subscription.refreshKeys(
                request.keys().auth(), request.keys().p256dh(), request.expirationTime(), request.userAgent());
        WebPushSubscription saved = subscriptionRepository.save(subscription);
        return WebPushSubscriptionResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<WebPushSubscriptionResponse> listSubscriptions(Long userId) {
        return subscriptionRepository.findByUser_Id(userId).stream()
                .map(WebPushSubscriptionResponse::from)
                .toList();
    }

    public void unsubscribe(Long userId, Long subscriptionId) {
        WebPushSubscription subscription = subscriptionRepository
                .findById(subscriptionId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "구독 정보를 찾을 수 없습니다."));

        if (!subscription.getUser().getId().equals(userId)) {
            throw new GuardianException(HttpStatus.FORBIDDEN, "삭제 권한이 없습니다.");
        }
        subscriptionRepository.delete(subscription);
    }

    @Transactional(readOnly = true)
    public List<WebPushSubscription> findByUser(Long userId) {
        return subscriptionRepository.findByUser_Id(userId);
    }

    private User getUser(Long userId) {
        return userRepository
                .findById(userId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
    }
}
