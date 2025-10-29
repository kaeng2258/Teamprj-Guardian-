package com.ll.guardian.domain.user.dto;

import com.ll.guardian.domain.user.UserRole;
import com.ll.guardian.domain.user.UserStatus;

public record UserResponse(Long id, String email, String name, UserRole role, UserStatus status) {}
