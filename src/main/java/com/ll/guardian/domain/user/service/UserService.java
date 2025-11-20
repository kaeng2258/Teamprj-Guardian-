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
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final Path profileImageDir = Paths.get("uploads", "profile-images");

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
                .birthDate(request.birthDate())
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

        return new UserResponse(
                saved.getId(),
                saved.getEmail(),
                saved.getName(),
                saved.getBirthDate(),
                saved.getRole(),
                saved.getStatus(),
                saved.getProfileImageUrl());
    }

    public UserResponse updateUser(Long userId, UserUpdateRequest request) {
        User user = getUser(userId);
        user.updateProfile(request.name(), request.profileImageUrl(), request.status());
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getBirthDate(),
                user.getRole(),
                user.getStatus(),
                user.getProfileImageUrl());
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
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getBirthDate(),
                user.getRole(),
                user.getStatus(),
                user.getProfileImageUrl());
    }

    @Transactional(readOnly = true)
    public boolean isEmailAvailable(String email) {
        return userRepository.findByEmail(email).isEmpty();
    }

    public UserResponse updateProfileImage(Long userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new GuardianException(HttpStatus.BAD_REQUEST, "업로드할 프로필 이미지를 선택해주세요.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new GuardianException(HttpStatus.BAD_REQUEST, "이미지 파일만 업로드할 수 있습니다.");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new GuardianException(HttpStatus.BAD_REQUEST, "이미지는 5MB 이하만 업로드할 수 있습니다.");
        }

        try {
            Files.createDirectories(profileImageDir);
            String extension = resolveExtension(Objects.requireNonNullElse(file.getOriginalFilename(), ""));
            String filename = UUID.randomUUID() + extension;
            Path target = profileImageDir.resolve(filename);
            file.transferTo(target.toFile());

            String url = "/files/profile-images/" + filename;
            User user = getUser(userId);
            user.updateProfile(user.getName(), url, null);

            return new UserResponse(
                    user.getId(),
                    user.getEmail(),
                    user.getName(),
                    user.getBirthDate(),
                    user.getRole(),
                    user.getStatus(),
                    user.getProfileImageUrl());
        } catch (IOException e) {
            throw new GuardianException(HttpStatus.INTERNAL_SERVER_ERROR, "프로필 이미지를 저장하지 못했습니다.");
        }
    }

    private User getUser(Long userId) {
        return userRepository
                .findById(userId)
                .orElseThrow(() -> new GuardianException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
    }

    private UserStatus resolveInitialStatus(UserRole role) {
        if (role == UserRole.MANAGER) {
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

    private String resolveExtension(String original) {
        String ext = "";
        if (StringUtils.hasText(original) && original.contains(".")) {
            ext = original.substring(original.lastIndexOf("."));
        }
        String normalized = ext.toLowerCase();
        if (!List.of(".jpg", ".jpeg", ".png", ".gif", ".webp").contains(normalized)) {
            return ".png";
        }
        return normalized;
    }
}
