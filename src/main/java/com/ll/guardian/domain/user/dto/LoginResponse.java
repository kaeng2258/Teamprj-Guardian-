package com.ll.guardian.domain.user.dto;

import com.ll.guardian.domain.user.UserRole;

public record LoginResponse(
        Long userId,
        UserRole role,
        String name,
        String accessToken,
        String refreshToken,
        String redirectPath) {}
