package com.ll.guardian.domain.emergency.service;

import com.ll.guardian.domain.emergency.EmergencyAlertStatus;
import com.ll.guardian.domain.emergency.dto.EmergencyAlertAcknowledgeRequest;
import com.ll.guardian.domain.emergency.dto.EmergencyAlertRequest;
import com.ll.guardian.domain.emergency.dto.EmergencyAlertResponse;
import com.ll.guardian.domain.emergency.entity.EmergencyAlert;
import com.ll.guardian.domain.emergency.repository.EmergencyAlertRepository;
import com.ll.guardian.domain.user.entity.User;
import com.ll.guardian.domain.user.repository.UserRepository;
import com.ll.guardian.global.exception.GuardianException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class EmergencyAlertService {

    private final EmergencyAlertRepository emergencyAlertRepository;
    private final UserRepository userRepository;

    public EmergencyAlertService(
            EmergencyAlertRepository emergencyAlertRepository, UserRepository userRepository) {
        this.emergencyAlertRepository = emergencyAlertRepository;
        this.userRepository = userRepository;
    }

    public EmergencyAlertResponse triggerAlert(EmergencyAlertRequest request) {
        User client = getUser(request.clientId());
        EmergencyAlert alert = EmergencyAlert.builder()
                .client(client)
                .alertType(request.alertType())
                .status(EmergencyAlertStatus.PENDING)
                .alertTime(request.alertTime() != null ? request.alertTime() : LocalDateTime.now())
                .latitude(request.shareLocation() ? request.latitude() : null)
                .longitude(request.shareLocation() ? request.longitude() : null)
                .build();
        EmergencyAlert saved = emergencyAlertRepository.save(alert);
        return EmergencyAlertResponse.from(saved);
    }

    public EmergencyAlertResponse acknowledge(EmergencyAlertAcknowledgeRequest request, Long providerId) {
        EmergencyAlert alert = emergencyAlertRepository
                .findById(request.alertId())
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "긴급 호출 내역을 찾을 수 없습니다."));
        User provider = getUser(providerId);
        alert.markResolved(
                provider,
                request.resolvedAt() != null ? request.resolvedAt() : LocalDateTime.now(),
                request.status(),
                request.memo());
        return EmergencyAlertResponse.from(alert);
    }

    @Transactional(readOnly = true)
    public List<EmergencyAlertResponse> findByClient(Long clientId) {
        return emergencyAlertRepository.findByClientId(clientId).stream()
                .map(EmergencyAlertResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EmergencyAlertResponse> findByStatus(EmergencyAlertStatus status) {
        return emergencyAlertRepository.findByStatus(status).stream()
                .map(EmergencyAlertResponse::from)
                .collect(Collectors.toList());
    }

    private User getUser(Long userId) {
        return userRepository
                .findById(userId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
    }
}
