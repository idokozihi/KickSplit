package com.kicksplit.backend.dto;

import com.kicksplit.backend.entity.RatingSource;

public record UpdateRatingSourceRequest(
        Long userId,
        RatingSource ratingSource) {
}