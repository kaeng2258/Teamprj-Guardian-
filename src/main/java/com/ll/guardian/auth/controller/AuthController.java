package com.ll.guardian.auth.controller;

import com.ll.guardian.domain.auth.service.LogoutService;
import com.ll.guardian.domain.user.dto.LoginRequest;
import com.ll.guardian.domain.user.dto.LoginResponse;
import com.ll.guardian.domain.user.dto.RefreshTokenRequest;
import com.ll.guardian.domain.user.dto.RefreshTokenResponse;
import com.ll.guardian.domain.user.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final LogoutService logoutService;

    public AuthController(AuthService authService, LogoutService logoutService) {
        this.authService = authService;
        this.logoutService = logoutService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<RefreshTokenResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        RefreshTokenResponse response = authService.refresh(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader("Authorization") String authorizationHeader) {
        logoutService.logout(authorizationHeader);
        return ResponseEntity.noContent().build();
    }
}
