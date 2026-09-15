package com.kicksplit.backend.dto;

public record VoteRequest(
        Long userId,
        Long proposalId) {
}