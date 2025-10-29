package com.ll.guardian.domain.user.dto;

import com.ll.guardian.domain.user.UserStatus;
import jakarta.validation.constraints.NotBlank;

public record UserUpdateRequest(
        @NotBlank(message = "이름을 입력해주세요.") String name,
        UserStatus status,
        String profileImageUrl) {}
