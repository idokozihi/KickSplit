package com.kicksplit.backend.dto;

public record VoteResponseDto(
        Long id,
        Long userId,
        Long gameId,
        Long proposalId) {
}