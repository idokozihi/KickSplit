package com.kicksplit.backend.dto;

public record GameResultRequest(
        Long userId,
        Long proposalId,
        int team1Wins,
        int team2Wins,
        int team3Wins
) {
}