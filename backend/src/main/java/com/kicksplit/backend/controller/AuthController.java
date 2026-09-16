package com.kicksplit.backend.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kicksplit.backend.dto.LoginRequest;
import com.kicksplit.backend.dto.RegisterRequest;
import com.kicksplit.backend.dto.UserResponseDto;
import com.kicksplit.backend.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public UserResponseDto register(@RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public UserResponseDto login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }
}