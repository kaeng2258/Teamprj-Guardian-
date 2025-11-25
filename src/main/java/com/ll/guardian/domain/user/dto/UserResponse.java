package com.ll.guardian.domain.user.dto;

import com.ll.guardian.domain.user.UserRole;
import com.ll.guardian.domain.user.UserStatus;
import java.time.LocalDate;

public record UserResponse(
        Long id,
        String email,
        String name,
        LocalDate birthDate,
        UserRole role,
        UserStatus status,
        String profileImageUrl,
        String address,
        String detailAddress,
        String zipCode) {}
