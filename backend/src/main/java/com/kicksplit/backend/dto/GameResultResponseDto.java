package com.kicksplit.backend.dto;

public record GameResultResponseDto(
        Long id,
        Long gameId,
        Long proposalId,
        Long enteredByUserId,
        int team1Wins,
        int team2Wins,
        int team3Wins
) {
}