package com.ll.guardian.domain.user.dto;

import com.ll.guardian.domain.user.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDate;

public record UserRegistrationRequest(
        @NotNull(message = "가입 유형을 선택해주세요.") UserRole role,
        @Email(message = "올바른 이메일 형식을 입력해주세요.") String email,
        @Pattern(
                        regexp = "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d!@#$%^&*()_+=-]{8,}$",
                        message = "비밀번호는 8자 이상이며 영문과 숫자를 포함해야 합니다.")
                String password,
        @NotBlank(message = "이름을 입력해주세요.") String name,
        @NotBlank(message = "연락처를 입력해주세요.")
                @Pattern(
                        regexp = "^\\d{3}-\\d{3,4}-\\d{4}$",
                        message = "올바른 전화번호 형식을 입력해주세요.")
                String phone,
        @NotNull(message = "생년월일을 입력해주세요.")
                @PastOrPresent(message = "생년월일은 오늘 이전 날짜만 입력 가능합니다.")
                LocalDate birthDate,
        String gender,
        @NotBlank(message = "우편번호를 입력해주세요.") String zipCode,
        @NotBlank(message = "주소를 입력해주세요.") String address,
        String detailAddress,
        boolean termsAgreed,
        boolean privacyAgreed) {}
