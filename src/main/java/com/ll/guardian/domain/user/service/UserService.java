package com.ll.guardian.domain.user.service;

import com.ll.guardian.domain.profile.entity.ClientProfile;
import com.ll.guardian.domain.profile.repository.ClientProfileRepository;
import com.ll.guardian.domain.user.UserRole;
import com.ll.guardian.domain.user.UserStatus;
import com.ll.guardian.domain.user.dto.UserRegistrationRequest;
import com.ll.guardian.domain.user.dto.UserResponse;
import com.ll.guardian.domain.user.dto.UserUpdateRequest;
import com.ll.guardian.domain.user.entity.User;
import com.ll.guardian.domain.user.repository.UserRepository;
import com.ll.guardian.global.exception.GuardianException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            ClientProfileRepository clientProfileRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.clientProfileRepository = clientProfileRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserResponse register(UserRegistrationRequest request) {
        if (!request.termsAgreed() || !request.privacyAgreed()) {
            throw new GuardianException(HttpStatus.BAD_REQUEST, "이용약관 및 개인정보 처리에 동의해야 합니다.");
        }

        userRepository
                .findByEmail(request.email())
                .ifPresent(user -> {
                    throw new GuardianException(HttpStatus.CONFLICT, "이미 가입된 이메일입니다.");
                });

        UserStatus initialStatus = resolveInitialStatus(request.role());
        User user = User.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .name(request.name())
                .role(request.role())
                .status(initialStatus)
                .build();

        User saved = userRepository.save(user);

        if (request.role() == UserRole.CLIENT) {
            String fullAddress = buildFullAddress(request);
            ClientProfile profile = ClientProfile.builder()
                    .client(saved)
                    .address(fullAddress)
                    .age(0)
                    .medicationCycle("미등록")
                    .build();
            clientProfileRepository.save(profile);
        }

        return new UserResponse(saved.getId(), saved.getEmail(), saved.getName(), saved.getRole(), saved.getStatus());
    }

    public UserResponse updateUser(Long userId, UserUpdateRequest request) {
        User user = getUser(userId);
        user.updateProfile(request.name(), request.profileImageUrl(), request.status());
        return new UserResponse(user.getId(), user.getEmail(), user.getName(), user.getRole(), user.getStatus());
    }

    public void deleteUser(Long userId) {
        User user = getUser(userId);
        if (user.getRole() == UserRole.CLIENT) {
            clientProfileRepository
                    .findByClientId(user.getId())
                    .ifPresent(clientProfileRepository::delete);
        }
        userRepository.delete(user);
    }

    @Transactional(readOnly = true)
    public UserResponse findUser(Long userId) {
        User user = getUser(userId);
        return new UserResponse(user.getId(), user.getEmail(), user.getName(), user.getRole(), user.getStatus());
    }

    @Transactional(readOnly = true)
    public boolean isEmailAvailable(String email) {
        return userRepository.findByEmail(email).isEmpty();
    }

    private User getUser(Long userId) {
        return userRepository
                .findById(userId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
    }

    private UserStatus resolveInitialStatus(UserRole role) {
        if (role == UserRole.PROVIDER) {
            return UserStatus.WAITING_MATCH;
        }
        return UserStatus.ACTIVE;
    }

    private String buildFullAddress(UserRegistrationRequest request) {
        StringBuilder builder = new StringBuilder();
        if (request.zipCode() != null && !request.zipCode().isBlank()) {
            builder.append("[").append(request.zipCode()).append("] ");
        }
        if (request.address() != null) {
            builder.append(request.address().trim());
        }
        if (request.detailAddress() != null && !request.detailAddress().isBlank()) {
            builder.append(" ").append(request.detailAddress().trim());
        }
        return builder.toString().trim();
    }
}
