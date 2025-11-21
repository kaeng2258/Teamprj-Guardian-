package com.ll.guardian.domain.notification.controller;

import com.ll.guardian.domain.notification.dto.WebPushSubscriptionRequest;
import com.ll.guardian.domain.notification.dto.WebPushSubscriptionResponse;
import com.ll.guardian.domain.notification.service.WebPushSubscriptionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/{userId}/push/subscriptions")
public class WebPushSubscriptionController {

    private final WebPushSubscriptionService subscriptionService;

    public WebPushSubscriptionController(WebPushSubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @PostMapping
    public ResponseEntity<WebPushSubscriptionResponse> subscribe(
            @PathVariable Long userId, @Valid @RequestBody WebPushSubscriptionRequest request) {
        WebPushSubscriptionResponse response = subscriptionService.subscribe(userId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{subscriptionId}")
    public ResponseEntity<Void> unsubscribe(@PathVariable Long userId, @PathVariable Long subscriptionId) {
        subscriptionService.unsubscribe(userId, subscriptionId);
        return ResponseEntity.noContent().build();
    }
}
