package com.kicksplit.backend.dto;

import java.util.List;

import com.kicksplit.backend.algorithm.PlayerCandidate;

public record TeamProposalResponseDto(
        Long id,
        int proposalNumber,
        List<List<PlayerCandidate>> teams,
        double balanceScore) {
}