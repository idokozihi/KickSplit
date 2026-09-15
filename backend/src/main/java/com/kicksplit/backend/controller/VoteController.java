package com.kicksplit.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kicksplit.backend.dto.VoteRequest;
import com.kicksplit.backend.dto.VoteResponseDto;
import com.kicksplit.backend.service.VoteService;

@RestController
@RequestMapping("/api/votes")
public class VoteController {

    private final VoteService voteService;

    public VoteController(VoteService voteService) {
        this.voteService = voteService;
    }

    @PostMapping("/game/{gameId}")
    public VoteResponseDto vote(
            @PathVariable Long gameId,
            @RequestBody VoteRequest request) {

        return voteService.vote(gameId, request);
    }

    @GetMapping("/game/{gameId}")
    public List<VoteResponseDto> getVotes(@PathVariable Long gameId) {
        return voteService.getVotes(gameId);
    }
}