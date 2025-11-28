package com.ll.guardian.domain.user.dto;

import com.ll.guardian.domain.user.UserStatus;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public record UserUpdateRequest(
        @NotBlank(message = "이름을 입력해주세요.") String name,
        @NotBlank(message = "비밀번호를 입력해주세요.") String currentPassword,
        LocalDate birthDate,
        String gender,
        String zipCode,
        String address,
        String detailAddress,
        UserStatus status,
        String profileImageUrl) {}
