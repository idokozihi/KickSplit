package com.kicksplit.backend.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.kicksplit.backend.dto.LoginRequest;
import com.kicksplit.backend.dto.RegisterRequest;
import com.kicksplit.backend.dto.UserResponseDto;
import com.kicksplit.backend.entity.User;
import com.kicksplit.backend.repository.UserRepository;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserResponseDto register(RegisterRequest request) {

        String email = request.email().trim().toLowerCase();

        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        if (request.password() == null || request.password().length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters");
        }

        String passwordHash = passwordEncoder.encode(request.password());

        User user = new User(
                request.name().trim(),
                "",
                null,
                email,
                passwordHash);

        User saved = userRepository.save(user);
        System.out.println(
        "NEW REGISTER - userId=" + saved.getId()
        + " - name=" + saved.getName()
        + " - email=" + saved.getEmail()
);

        return UserResponseDto.fromUser(saved);
    }

    public UserResponseDto login(LoginRequest request) {

        String email = request.email().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (user.getPasswordHash() == null ||
                !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password");
        }
        System.out.println(
        "LOGIN SUCCESS - userId=" + user.getId()
        + " - name=" + user.getName()
        + " - email=" + user.getEmail()
);
        return UserResponseDto.fromUser(user);
    }
}