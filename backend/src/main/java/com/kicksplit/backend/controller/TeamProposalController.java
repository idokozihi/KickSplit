package com.kicksplit.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.kicksplit.backend.dto.RegenerationVoteRequest;
import com.kicksplit.backend.dto.RegenerationVoteResponseDto;
import com.kicksplit.backend.dto.TeamProposalResponseDto;
import com.kicksplit.backend.service.TeamProposalService;

@RestController
@RequestMapping("/api/team-proposals")
public class TeamProposalController {

    private final TeamProposalService teamProposalService;

    public TeamProposalController(
            TeamProposalService teamProposalService) {

        this.teamProposalService =
                teamProposalService;
    }

    @GetMapping("/game/{gameId}")
    public List<TeamProposalResponseDto> getProposals(
            @PathVariable Long gameId) {

        return teamProposalService
                .getOrGenerateProposals(gameId);
    }

    @GetMapping("/game/{gameId}/regeneration-vote")
    public RegenerationVoteResponseDto
            getRegenerationVoteStatus(
                    @PathVariable Long gameId,
                    @RequestParam Long userId) {

        return teamProposalService
                .getRegenerationVoteStatus(
                        gameId,
                        userId);
    }

    @PostMapping("/game/{gameId}/regeneration-vote")
    public RegenerationVoteResponseDto
            voteForRegeneration(
                    @PathVariable Long gameId,
                    @RequestBody
                    RegenerationVoteRequest request) {

        return teamProposalService
                .voteForRegeneration(
                        gameId,
                        request.userId());
    }
}