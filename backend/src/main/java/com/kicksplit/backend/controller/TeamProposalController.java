package com.kicksplit.backend.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kicksplit.backend.service.TeamProposalService;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.kicksplit.backend.algorithm.TeamProposal;

@RestController
@RequestMapping("/api/team-proposals")
public class TeamProposalController {

    private final TeamProposalService teamProposalService;

    public TeamProposalController(TeamProposalService teamProposalService) {
        this.teamProposalService = teamProposalService;
    }

    @GetMapping("/game/{gameId}")
    public List<TeamProposal> generateProposals(@PathVariable Long gameId) {
        return teamProposalService.generateProposals(gameId);
    }
}