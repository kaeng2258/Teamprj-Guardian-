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
        String phone,
        String address,
        String detailAddress,
        String zipCode,
        LocalDateTime createdAt
) {

    public static AdminUserSummaryResponse from(User user) {
        return new AdminUserSummaryResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getStatus(),
                user.getPhone(),
                user.getAddress(),
                user.getDetailAddress(),
                user.getZipCode(),
                user.getCreatedAt()
        );
    }
}
