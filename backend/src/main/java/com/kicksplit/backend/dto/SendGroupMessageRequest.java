package com.kicksplit.backend.dto;

public record SendGroupMessageRequest(
        Long userId,
        String content) {
}