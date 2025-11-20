package com.ll.guardian.domain.profile.service;

import com.ll.guardian.domain.matching.dto.AssignedManagerResponse;
import com.ll.guardian.domain.matching.entity.CareMatch;
import com.ll.guardian.domain.matching.repository.CareMatchRepository;
import com.ll.guardian.domain.profile.dto.ClientProfileResponse;
import com.ll.guardian.domain.profile.dto.ClientProfileUpdateRequest;
import com.ll.guardian.domain.profile.entity.ClientProfile;
import com.ll.guardian.domain.profile.repository.ClientProfileRepository;
import com.ll.guardian.domain.user.entity.User;
import com.ll.guardian.domain.user.repository.UserRepository;
import com.ll.guardian.global.exception.GuardianException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ClientProfileService {

    private final ClientProfileRepository clientProfileRepository;
    private final CareMatchRepository careMatchRepository;
    private final UserRepository userRepository;

    public ClientProfileService(
            ClientProfileRepository clientProfileRepository,
            CareMatchRepository careMatchRepository,
            UserRepository userRepository) {
        this.clientProfileRepository = clientProfileRepository;
        this.careMatchRepository = careMatchRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public ClientProfileResponse getProfile(Long clientId) {
        ClientProfile profile = getClientProfile(clientId);
        return ClientProfileResponse.from(profile);
    }

    public ClientProfileResponse updateProfile(Long clientId, ClientProfileUpdateRequest request) {
        ClientProfile profile = getClientProfile(clientId);
        profile.updateProfile(request.address(), request.age(), request.medicalNotes(), request.medicationCycle());
        return ClientProfileResponse.from(profile);
    }

    public void deleteProfile(Long clientId) {
        ClientProfile profile = getClientProfile(clientId);
        clientProfileRepository.delete(profile);
    }

    @Transactional(readOnly = true)
    public AssignedManagerResponse getAssignedManager(Long clientId) {
        CareMatch match = careMatchRepository
                .findFirstByClientIdAndCurrentTrue(clientId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "배정된 담당자를 찾을 수 없습니다."));
        User manager = match.getManager();
        return new AssignedManagerResponse(
                match.getId(), manager.getId(), manager.getName(), manager.getEmail(), match.isCurrent());
    }

    private ClientProfile getClientProfile(Long clientId) {
        return clientProfileRepository
                .findByClientId(clientId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "클라이언트 프로필을 찾을 수 없습니다."));
    }
}
