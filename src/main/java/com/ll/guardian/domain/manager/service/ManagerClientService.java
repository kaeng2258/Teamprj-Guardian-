package com.ll.guardian.domain.manager.service;

import com.ll.guardian.domain.matching.entity.CareMatch;
import com.ll.guardian.domain.matching.repository.CareMatchRepository;
import com.ll.guardian.domain.manager.dto.ManagerClientSearchResponse;
import com.ll.guardian.domain.user.UserRole;
import com.ll.guardian.domain.user.entity.User;
import com.ll.guardian.domain.user.repository.UserRepository;
import com.ll.guardian.global.exception.GuardianException;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ManagerClientService {

    private static final int DEFAULT_LIMIT = 20;

    private final UserRepository userRepository;
    private final CareMatchRepository careMatchRepository;

    public ManagerClientService(UserRepository userRepository, CareMatchRepository careMatchRepository) {
        this.userRepository = userRepository;
        this.careMatchRepository = careMatchRepository;
    }

    public List<ManagerClientSearchResponse> searchClients(Long managerId, String keyword, Integer limit) {
        User manager = getManager(managerId);

        if (keyword == null || keyword.trim().isEmpty()) {
            return Collections.emptyList();
        }

        String normalized = keyword.trim();
        int pageSize = limit != null ? Math.max(1, Math.min(limit, 50)) : DEFAULT_LIMIT;

        List<User> clients = userRepository.searchByRoleAndKeyword(
                UserRole.CLIENT, normalized, PageRequest.of(0, pageSize));

        if (clients.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Long, CareMatch> currentMatches = careMatchRepository
                .findByClientIdInAndCurrentTrue(clients.stream().map(User::getId).toList())
                .stream()
                .collect(Collectors.toMap(
                        match -> match.getClient().getId(),
                        match -> match,
                        // 동일 클라이언트에 중복 current 매칭이 있을 때 가장 최근(id 큰) 매칭을 사용
                        (a, b) -> a.getId() >= b.getId() ? a : b
                ));

        return clients.stream()
                .map(client -> toResponse(manager, client, currentMatches.get(client.getId())))
                .toList();
    }

    public ManagerClientSearchResponse getClientDetail(Long managerId, Long clientId) {
        User manager = getManager(managerId);
        User client = userRepository
                .findByIdAndRole(clientId, UserRole.CLIENT)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "클라이언트를 찾을 수 없습니다."));

        CareMatch match = careMatchRepository.findFirstByClientIdAndCurrentTrue(client.getId()).orElse(null);
        return toResponse(manager, client, match);
    }

    private ManagerClientSearchResponse toResponse(User manager, User client, CareMatch match) {
        String address = client.getClientProfile() != null ? client.getClientProfile().getAddress() : null;
        Integer age = client.getClientProfile() != null ? client.getClientProfile().getAge() : null;
        String medicationCycle = client.getClientProfile() != null ? client.getClientProfile().getMedicationCycle() : null;

        boolean currentlyAssigned = match != null && match.isCurrent();
        Long assignedManagerId = currentlyAssigned ? match.getManager().getId() : null;
        String assignedManagerName = currentlyAssigned ? match.getManager().getName() : null;
        String assignedManagerEmail = currentlyAssigned ? match.getManager().getEmail() : null;
        // M:N 지원: 다른 매니저가 배정되어 있어도 추가 배정 가능
        boolean assignable = true;

        return new ManagerClientSearchResponse(
                client.getId(),
                client.getName(),
                client.getEmail(),
                client.getStatus().name(),
                address,
                age,
                medicationCycle,
                currentlyAssigned,
                assignedManagerId,
                assignedManagerName,
                assignedManagerEmail,
                assignable);
    }

    private User getManager(Long managerId) {
        User manager = userRepository
                .findById(managerId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "매니저를 찾을 수 없습니다."));
        if (manager.getRole() != UserRole.MANAGER) {
            throw new GuardianException(HttpStatus.BAD_REQUEST, "매니저 계정이 아닙니다.");
        }
        return manager;
    }
}
