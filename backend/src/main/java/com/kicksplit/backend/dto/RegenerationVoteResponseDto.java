package com.kicksplit.backend.dto;

import java.util.List;

public record RegenerationVoteResponseDto(
        int voteCount,
        int requiredVotes,
        boolean currentUserVoted,
        boolean eligible,
        boolean blockedByResult,
        boolean regenerated,
        List<TeamProposalResponseDto> proposals
) {
}