package com.ll.guardian.domain.admin.dto;

import com.ll.guardian.domain.user.UserRole;
import com.ll.guardian.domain.user.UserStatus;
import com.ll.guardian.domain.user.entity.User;

import java.time.LocalDateTime;

public record AdminUserSummaryResponse(
        Long id,
        String name,
        String email,
        UserRole role,
        UserStatus status,
        LocalDateTime createdAt
) {

    public static AdminUserSummaryResponse from(User user) {
        return new AdminUserSummaryResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt()
        );
    }
}