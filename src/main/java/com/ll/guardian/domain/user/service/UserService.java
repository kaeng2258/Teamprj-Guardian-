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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
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

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final Path profileImageDir = Paths.get("uploads", "profile-images").toAbsolutePath();
    private static final long MAX_PROFILE_IMAGE_SIZE = 20L * 1024 * 1024; // 20MB

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

        validateBirthDate(request.birthDate());

        userRepository
                .findByEmail(request.email())
                .ifPresent(
                        user -> {
                            throw new GuardianException(HttpStatus.CONFLICT, "이미 가입된 이메일입니다.");
                        });

        UserStatus initialStatus = resolveInitialStatus(request.role());
        User user =
                User.builder()
                        .email(request.email())
                        .password(passwordEncoder.encode(request.password()))
                        .name(request.name())
                        .phone(request.phone())
                        .birthDate(request.birthDate())
                        .gender(request.gender())
                        .zipCode(request.zipCode())
                        .address(request.address())
                        .detailAddress(request.detailAddress())
                        .role(request.role())
                        .status(initialStatus)
                        .build();

        User saved = userRepository.save(user);

        if (request.role() == UserRole.CLIENT) {
            ClientProfile profile =
                    ClientProfile.builder()
                            .client(saved)
                            .address(request.address())
                            .detailAddress(request.detailAddress())
                            .zipCode(request.zipCode())
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
                saved.getGender(),
                saved.getRole(),
                saved.getStatus(),
                saved.getProfileImageUrl(),
                saved.getAddress(),
                saved.getDetailAddress(),
                saved.getZipCode(),
                saved.getPhone());
    }

    public UserResponse updateUser(Long userId, UserUpdateRequest request) {
        User user = getUser(userId);

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new GuardianException(HttpStatus.UNAUTHORIZED, "비밀번호가 일치하지 않아 개인정보를 수정할 수 없습니다.");
        }

        validateBirthDate(request.birthDate());

        user.updateProfile(
                request.name(),
                request.birthDate(),
                request.gender(),
                request.zipCode(),
                request.address(),
                request.detailAddress(),
                request.phone(),
                request.profileImageUrl(),
                request.status());

        if (user.getRole() == UserRole.CLIENT) {
            ClientProfile profile =
                    clientProfileRepository
                            .findByClientId(userId)
                            .orElse(null);
            if (profile != null) {
                profile.updateProfile(
                        request.address() != null ? request.address() : profile.getAddress(),
                        request.detailAddress() != null ? request.detailAddress() : profile.getDetailAddress(),
                        request.zipCode() != null ? request.zipCode() : profile.getZipCode(),
                        profile.getAge(),
                        profile.getMedicalNotes(),
                        profile.getMedicationCycle());
                return new UserResponse(
                        user.getId(),
                        user.getEmail(),
                        user.getName(),
                        user.getBirthDate(),
                        user.getGender(),
                        user.getRole(),
                        user.getStatus(),
                        user.getProfileImageUrl(),
                        profile.getAddress(),
                        profile.getDetailAddress(),
                        profile.getZipCode(),
                        user.getPhone());
            } // Closing brace for if (profile != null)
        } // Closing brace for if (user.getRole() == UserRole.CLIENT)
        // This is the default return for the updateUser method
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getBirthDate(),
                user.getGender(),
                user.getRole(),
                user.getStatus(),
                user.getProfileImageUrl(),
                user.getAddress(),
                user.getDetailAddress(),
                user.getZipCode(),
                user.getPhone());
    }

    private void validateBirthDate(LocalDate birthDate) {
        if (birthDate != null && birthDate.isAfter(LocalDate.now())) {
            throw new GuardianException(HttpStatus.BAD_REQUEST, "생년월일은 오늘 이전 날짜만 입력 가능합니다.");
        }
    }

    public void deleteUser(Long userId) {
        User user = getUser(userId);
        if (user.getRole() == UserRole.CLIENT) {
            clientProfileRepository.findByClientId(user.getId()).ifPresent(clientProfileRepository::delete);
        }
        userRepository.delete(user);
    }

    @Transactional(readOnly = true)
    public UserResponse findUser(Long userId) {
        User user = getUser(userId);

        if (user.getRole() == UserRole.CLIENT) {
            return clientProfileRepository
                    .findByClientId(userId)
                    .map(
                            profile ->
                                    new UserResponse(
                                            user.getId(),
                                            user.getEmail(),
                                            user.getName(),
                                            user.getBirthDate(),
                                            user.getGender(),
                                            user.getRole(),
                                            user.getStatus(),
                                            user.getProfileImageUrl(),
                                            user.getAddress() != null ? user.getAddress() : profile.getAddress(),
                                            user.getDetailAddress() != null
                                                    ? user.getDetailAddress()
                                                    : profile.getDetailAddress(),
                                            user.getZipCode() != null ? user.getZipCode() : profile.getZipCode(),
                                            user.getPhone()))
                    .orElse(
                            new UserResponse(
                                    user.getId(),
                                    user.getEmail(),
                                    user.getName(),
                                    user.getBirthDate(),
                                    user.getGender(),
                                    user.getRole(),
                                    user.getStatus(),
                                    user.getProfileImageUrl(),
                                    user.getAddress(),
                                    user.getDetailAddress(),
                                    user.getZipCode(),
                                    user.getPhone()));
        }

        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getBirthDate(),
                user.getGender(),
                user.getRole(),
                user.getStatus(),
                user.getProfileImageUrl(),
                user.getAddress(),
                user.getDetailAddress(),
                user.getZipCode(),
                user.getPhone());
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
        if (file.getSize() > MAX_PROFILE_IMAGE_SIZE) {
            throw new GuardianException(HttpStatus.BAD_REQUEST, "이미지는 20MB 이하만 업로드할 수 있습니다.");
        }

        try {
            Files.createDirectories(profileImageDir);
            String extension =
                    resolveExtension(Objects.requireNonNullElse(file.getOriginalFilename(), ""));
            String filename = UUID.randomUUID() + extension;
            Path target = profileImageDir.resolve(filename);
            try (var inputStream = file.getInputStream()) {
                Files.copy(inputStream, target, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            }

            String url = "/files/profile-images/" + filename;
            User user = getUser(userId);
            user.updateProfile(
                    user.getName(),
                    user.getBirthDate(),
                    user.getGender(),
                    user.getZipCode(),
                    user.getAddress(),
                    user.getDetailAddress(),
                    user.getPhone(),
                    url,
                    null);

            if (user.getRole() == UserRole.CLIENT) {
                ClientProfile profile =
                        clientProfileRepository
                                .findByClientId(userId)
                                .orElse(null);
                if (profile != null) {
                    return new UserResponse(
                            user.getId(),
                            user.getEmail(),
                            user.getName(),
                            user.getBirthDate(),
                            user.getGender(),
                            user.getRole(),
                            user.getStatus(),
                            user.getProfileImageUrl(),
                            user.getAddress() != null ? user.getAddress() : profile.getAddress(),
                            user.getDetailAddress() != null
                                    ? user.getDetailAddress()
                                    : profile.getDetailAddress(),
                            user.getZipCode() != null ? user.getZipCode() : profile.getZipCode(),
                            user.getPhone());
                }
            }

            return new UserResponse(
                    user.getId(),
                    user.getEmail(),
                    user.getName(),
                    user.getBirthDate(),
                    user.getGender(),
                    user.getRole(),
                    user.getStatus(),
                    user.getProfileImageUrl(),
                    user.getAddress(),
                    user.getDetailAddress(),
                    user.getZipCode(),
                    user.getPhone());
        } catch (IOException e) {
            log.error("Failed to store profile image at {}: {}", profileImageDir, e.getMessage(), e);
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
