package com.kicksplit.backend.dto;

public record LoginRequest(
        String email,
        String password) {
}