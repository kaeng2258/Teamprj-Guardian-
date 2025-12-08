package com.ll.guardian.domain.user.dto;

import com.ll.guardian.domain.user.UserStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import java.time.LocalDate;

public record UserUpdateRequest(
        @NotBlank(message = "이름을 입력해주세요.") String name,
        @NotBlank(message = "비밀번호를 입력해주세요.") String currentPassword,
        @PastOrPresent(message = "생년월일은 오늘 이전 날짜만 입력 가능합니다.") LocalDate birthDate,
        String gender,
        String zipCode,
        String address,
        String detailAddress,
        String phone,
        UserStatus status,
        String profileImageUrl) {}
