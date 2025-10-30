package com.ll.guardian.auth.dto;

public record LoginResponse(String message) {
    public static LoginResponse success(String username) {
        return new LoginResponse(username + "님 환영합니다.");
    }

    public static LoginResponse failure() {
        return new LoginResponse("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
}
