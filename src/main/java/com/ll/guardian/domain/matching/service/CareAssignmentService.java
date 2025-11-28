package com.ll.guardian.domain.matching.service;

import com.ll.guardian.domain.matching.dto.CareAssignmentRequest;
import com.ll.guardian.domain.matching.dto.CareAssignmentResponse;
import com.ll.guardian.domain.matching.entity.CareMatch;
import com.ll.guardian.domain.matching.repository.CareMatchRepository;
import com.ll.guardian.domain.user.entity.User;
import com.ll.guardian.domain.user.repository.UserRepository;
import com.ll.guardian.global.exception.GuardianException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CareAssignmentService {

    private final CareMatchRepository careMatchRepository;
    private final UserRepository userRepository;

    public CareAssignmentService(CareMatchRepository careMatchRepository, UserRepository userRepository) {
        this.careMatchRepository = careMatchRepository;
        this.userRepository = userRepository;
    }

    public CareAssignmentResponse assign(CareAssignmentRequest request) {
        User client = getUser(request.clientId());
        User manager = getUser(request.managerId());

        careMatchRepository.findByClientId(client.getId()).stream()
                .filter(CareMatch::isCurrent)
                .forEach(match -> match.deactivate(LocalDate.now()));

        CareMatch newMatch = CareMatch.builder()
                .client(client)
                .manager(manager)
                .startDate(request.startDate() != null ? request.startDate() : LocalDate.now())
                .endDate(request.endDate())
                .current(true)
                .matchDate(LocalDateTime.now())
                .build();

        CareMatch saved = careMatchRepository.save(newMatch);
        return CareAssignmentResponse.from(saved);
    }

    public void unassign(Long matchId, LocalDate endDate) {
        CareMatch match = careMatchRepository
                .findById(matchId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "매칭 정보를 찾을 수 없습니다."));
        match.deactivate(endDate != null ? endDate : LocalDate.now());
    }

    @Transactional(readOnly = true)
    public List<CareAssignmentResponse> findByClient(Long clientId) {
        return careMatchRepository.findByClientId(clientId).stream()
                .map(CareAssignmentResponse::from)
                .collect(Collectors.toList());
    }

    public void unassign(Long clientId, Long managerId, LocalDate endDate) {
        CareMatch match = careMatchRepository
                .findFirstByClientIdAndManagerIdAndCurrentTrue(clientId, managerId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "현재 배정 정보를 찾을 수 없습니다."));
        unassign(match.getId(), endDate);
    }

    private User getUser(Long userId) {
        return userRepository
                .findById(userId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
    }
}
