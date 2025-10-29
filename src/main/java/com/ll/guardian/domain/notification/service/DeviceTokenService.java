package com.ll.guardian.domain.notification.service;

import com.ll.guardian.domain.notification.dto.DeviceTokenRequest;
import com.ll.guardian.domain.notification.dto.DeviceTokenResponse;
import com.ll.guardian.domain.notification.entity.DeviceToken;
import com.ll.guardian.domain.notification.repository.DeviceTokenRepository;
import com.ll.guardian.domain.user.entity.User;
import com.ll.guardian.domain.user.repository.UserRepository;
import com.ll.guardian.global.exception.GuardianException;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class DeviceTokenService {

    private final DeviceTokenRepository deviceTokenRepository;
    private final UserRepository userRepository;

    public DeviceTokenService(DeviceTokenRepository deviceTokenRepository, UserRepository userRepository) {
        this.deviceTokenRepository = deviceTokenRepository;
        this.userRepository = userRepository;
    }

    public DeviceTokenResponse register(DeviceTokenRequest request) {
        User user = getUser(request.userId());

        DeviceToken token = deviceTokenRepository
                .findByToken(request.token())
                .map(existing -> {
                    existing.refreshUsage(request.deviceOs());
                    return existing;
                })
                .orElseGet(() -> deviceTokenRepository.save(DeviceToken.builder()
                        .user(user)
                        .token(request.token())
                        .deviceOs(request.deviceOs())
                        .lastUsedAt(java.time.LocalDateTime.now())
                        .active(true)
                        .build()));

        return DeviceTokenResponse.from(token);
    }

    public void deactivate(Long tokenId) {
        DeviceToken token = deviceTokenRepository
                .findById(tokenId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "토큰을 찾을 수 없습니다."));
        token.deactivate();
    }

    @Transactional(readOnly = true)
    public List<DeviceTokenResponse> getActiveTokens(Long userId) {
        return deviceTokenRepository.findByUserIdAndActiveTrue(userId).stream()
                .map(DeviceTokenResponse::from)
                .collect(Collectors.toList());
    }

    private User getUser(Long userId) {
        return userRepository
                .findById(userId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
    }
}
