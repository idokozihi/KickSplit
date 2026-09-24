package com.kicksplit.backend.dto;

public record UpdateSelfRatingRequest(
        Long userId,
        int selfOverallRating,
        int selfAttackRating,
        int selfDefenseRating) {
}