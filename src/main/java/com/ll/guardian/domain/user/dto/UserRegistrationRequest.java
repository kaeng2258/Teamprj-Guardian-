package com.ll.guardian.domain.user.dto;

import com.ll.guardian.domain.user.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record UserRegistrationRequest(
        @NotNull(message = "가입 유형을 선택해주세요.") UserRole role,
        @Email(message = "올바른 이메일 형식을 입력해주세요.") String email,
        @Pattern(
                        regexp = "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d!@#$%^&*()_+=-]{8,}$",
                        message = "비밀번호는 8자 이상이며 영문과 숫자를 포함해야 합니다.")
                String password,
        @NotBlank(message = "이름을 입력해주세요.") String name,
        boolean termsAgreed,
        boolean privacyAgreed) {}
