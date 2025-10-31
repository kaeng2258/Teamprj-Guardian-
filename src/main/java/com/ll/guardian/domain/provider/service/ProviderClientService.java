package com.ll.guardian.domain.provider.service;

import com.ll.guardian.domain.matching.entity.CareMatch;
import com.ll.guardian.domain.matching.repository.CareMatchRepository;
import com.ll.guardian.domain.provider.dto.ProviderClientSearchResponse;
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
public class ProviderClientService {

    private static final int DEFAULT_LIMIT = 20;

    private final UserRepository userRepository;
    private final CareMatchRepository careMatchRepository;

    public ProviderClientService(UserRepository userRepository, CareMatchRepository careMatchRepository) {
        this.userRepository = userRepository;
        this.careMatchRepository = careMatchRepository;
    }

    public List<ProviderClientSearchResponse> searchClients(Long providerId, String keyword, Integer limit) {
        User provider = getProvider(providerId);

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
                .collect(Collectors.toMap(match -> match.getClient().getId(), match -> match));

        return clients.stream()
                .map(client -> toResponse(provider, client, currentMatches.get(client.getId())))
                .toList();
    }

    public ProviderClientSearchResponse getClientDetail(Long providerId, Long clientId) {
        User provider = getProvider(providerId);
        User client = userRepository
                .findByIdAndRole(clientId, UserRole.CLIENT)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "클라이언트를 찾을 수 없습니다."));

        CareMatch match = careMatchRepository.findFirstByClientIdAndCurrentTrue(client.getId()).orElse(null);
        return toResponse(provider, client, match);
    }

    private ProviderClientSearchResponse toResponse(User provider, User client, CareMatch match) {
        String address = client.getClientProfile() != null ? client.getClientProfile().getAddress() : null;
        Integer age = client.getClientProfile() != null ? client.getClientProfile().getAge() : null;
        String medicationCycle = client.getClientProfile() != null ? client.getClientProfile().getMedicationCycle() : null;

        boolean currentlyAssigned = match != null && match.isCurrent();
        Long assignedProviderId = currentlyAssigned ? match.getProvider().getId() : null;
        String assignedProviderName = currentlyAssigned ? match.getProvider().getName() : null;
        String assignedProviderEmail = currentlyAssigned ? match.getProvider().getEmail() : null;
        boolean assignable = !currentlyAssigned || Objects.equals(assignedProviderId, provider.getId());

        return new ProviderClientSearchResponse(
                client.getId(),
                client.getName(),
                client.getEmail(),
                client.getStatus().name(),
                address,
                age,
                medicationCycle,
                currentlyAssigned,
                assignedProviderId,
                assignedProviderName,
                assignedProviderEmail,
                assignable);
    }

    private User getProvider(Long providerId) {
        User provider = userRepository
                .findById(providerId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "제공자를 찾을 수 없습니다."));
        if (provider.getRole() != UserRole.PROVIDER) {
            throw new GuardianException(HttpStatus.BAD_REQUEST, "제공자 계정이 아닙니다.");
        }
        return provider;
    }
}
