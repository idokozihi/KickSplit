package com.kicksplit.backend.dto;

public record UpdateGroupImageRequest(
        Long userId,
        String imageUrl) {
}