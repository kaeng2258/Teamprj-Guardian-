package com.ll.guardian.domain.emergency.service;

import com.ll.guardian.domain.emergency.EmergencyAlertStatus;
import com.ll.guardian.domain.emergency.EmergencyAlertType;
import com.ll.guardian.domain.emergency.dto.EmergencyAlertAcknowledgeRequest;
import com.ll.guardian.domain.emergency.dto.EmergencyAlertRequest;
import com.ll.guardian.domain.emergency.dto.EmergencyAlertResponse;
import com.ll.guardian.domain.emergency.entity.EmergencyAlert;
import com.ll.guardian.domain.emergency.repository.EmergencyAlertRepository;
import com.ll.guardian.domain.chat.MessageType;
import com.ll.guardian.domain.chat.dto.ChatMessageRequest;
import com.ll.guardian.domain.chat.dto.ChatMessageResponse;
import com.ll.guardian.domain.chat.entity.ChatRoom;
import com.ll.guardian.domain.chat.service.ChatService;
import com.ll.guardian.domain.matching.repository.CareMatchRepository;
import com.ll.guardian.domain.user.entity.User;
import com.ll.guardian.domain.user.repository.UserRepository;
import com.ll.guardian.global.exception.GuardianException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class EmergencyAlertService {

    private static final Logger log = LoggerFactory.getLogger(EmergencyAlertService.class);

    private final EmergencyAlertRepository emergencyAlertRepository;
    private final UserRepository userRepository;
    private final CareMatchRepository careMatchRepository;
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    public EmergencyAlertService(
            EmergencyAlertRepository emergencyAlertRepository,
            UserRepository userRepository,
            CareMatchRepository careMatchRepository,
            ChatService chatService,
            SimpMessagingTemplate messagingTemplate) {
        this.emergencyAlertRepository = emergencyAlertRepository;
        this.userRepository = userRepository;
        this.careMatchRepository = careMatchRepository;
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
    }

    public EmergencyAlertResponse triggerAlert(EmergencyAlertRequest request, String requesterEmail) {
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
        Long requesterId = resolveRequesterId(requesterEmail);
        Long managerIdForAlert = resolveManagerForAlert(client.getId(), request.alertType(), requesterId);
        notifyViaChat(client, request.alertType(), managerIdForAlert);
        return EmergencyAlertResponse.from(saved);
    }

    public EmergencyAlertResponse acknowledge(EmergencyAlertAcknowledgeRequest request, Long managerId) {
        EmergencyAlert alert = emergencyAlertRepository
                .findById(request.alertId())
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "긴급 호출 내역을 찾을 수 없습니다."));
        User manager = getUser(managerId);
        alert.markResolved(
                manager,
                request.resolvedAt() != null ? request.resolvedAt() : LocalDateTime.now(),
                request.status(),
                request.memo());
        return EmergencyAlertResponse.from(alert);
    }

    public List<EmergencyAlertResponse> acknowledgeAllPending(Long managerId) {
        User manager = getUser(managerId);
        LocalDateTime now = LocalDateTime.now();
        return emergencyAlertRepository.findByStatus(EmergencyAlertStatus.PENDING).stream()
                .map(alert -> {
                    alert.markResolved(manager, now, EmergencyAlertStatus.ACKNOWLEDGED, alert.getMemo());
                    return EmergencyAlertResponse.from(alert);
                })
                .collect(Collectors.toList());
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

    private void notifyViaChat(User client, EmergencyAlertType alertType, Long managerId) {
        if (managerId == null) {
            log.warn("Emergency chat notify skipped. No manager found for clientId={}", client.getId());
            return;
        }

        Long senderId = alertType == EmergencyAlertType.MANAGER_REQUEST ? managerId : client.getId();
        String content = alertType == EmergencyAlertType.MANAGER_REQUEST
                ? "매니저가 긴급 호출을 전송했습니다. 즉시 확인해주세요."
                : "긴급 호출이 접수되었습니다. 즉시 확인해주세요.";

        try {
            ChatRoom room = chatService.openOrGetRoom(client.getId(), managerId);
            ChatMessageRequest req = new ChatMessageRequest(
                    room.getId(),
                    senderId,
                    content,
                    MessageType.NOTICE,
                    null
            );
            ChatMessageResponse msg = chatService.sendMessage(req);
            messagingTemplate.convertAndSend("/topic/room/" + room.getId(), msg);
        } catch (Exception e) {
            log.warn("Emergency chat notify failed. clientId={}, managerId={}", client.getId(), managerId, e);
        }
    }

    private Long resolveRequesterId(String requesterEmail) {
        if (requesterEmail == null || requesterEmail.isBlank()) {
            return null;
        }
        return userRepository.findByEmail(requesterEmail).map(User::getId).orElse(null);
    }

    private Long resolveManagerForAlert(Long clientId, EmergencyAlertType alertType, Long requesterId) {
        if (alertType == EmergencyAlertType.MANAGER_REQUEST) {
            if (requesterId == null) {
                throw new GuardianException(HttpStatus.FORBIDDEN, "매니저 인증 정보가 없습니다.");
            }
            return careMatchRepository
                    .findFirstByClientIdAndManagerIdAndCurrentTrue(clientId, requesterId)
                    .map(match -> match.getManager().getId())
                    .orElseThrow(() -> new GuardianException(
                            HttpStatus.FORBIDDEN,
                            "해당 클라이언트에 대한 매칭 권한이 없습니다."));
        }

        return careMatchRepository.findFirstByClientIdAndCurrentTrue(clientId)
                .or(() -> careMatchRepository.findFirstByClientIdOrderByIdDesc(clientId))
                .map(match -> match.getManager().getId())
                .orElse(null);
    }
}
