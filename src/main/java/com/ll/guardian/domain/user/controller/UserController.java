package com.ll.guardian.domain.user.controller;

import com.ll.guardian.domain.user.dto.EmailCheckResponse;
import com.ll.guardian.domain.user.dto.UserRegistrationRequest;
import com.ll.guardian.domain.user.dto.UserResponse;
import com.ll.guardian.domain.user.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@Validated
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<UserResponse> register(@Valid @RequestBody UserRegistrationRequest request) {
        UserResponse response = userService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/check-email")
    public ResponseEntity<EmailCheckResponse> checkEmailAvailability(
            @RequestParam("email") @NotBlank(message = "이메일을 입력해주세요.") @Email(message = "올바른 이메일 형식을 입력해주세요.") String email) {
        boolean available = userService.isEmailAvailable(email);
        String message = available ? "사용 가능한 이메일입니다." : "이미 사용 중인 이메일입니다.";
        return ResponseEntity.ok(new EmailCheckResponse(available, message));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> findUser(@PathVariable Long userId) {
        UserResponse response = userService.findUser(userId);
        return ResponseEntity.ok(response);
    }
}
