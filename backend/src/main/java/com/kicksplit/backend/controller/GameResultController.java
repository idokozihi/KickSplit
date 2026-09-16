package com.kicksplit.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kicksplit.backend.dto.GameResultRequest;
import com.kicksplit.backend.dto.GameResultResponseDto;
import com.kicksplit.backend.service.GameResultService;

@RestController
@RequestMapping("/api/game-results")
public class GameResultController {

    private final GameResultService gameResultService;

    public GameResultController(
            GameResultService gameResultService) {
        this.gameResultService = gameResultService;
    }

    @PostMapping("/game/{gameId}")
    public GameResultResponseDto saveResult(
            @PathVariable Long gameId,
            @RequestBody GameResultRequest request) {

        return gameResultService.saveResult(gameId, request);
    }

    @GetMapping("/game/{gameId}")
    public GameResultResponseDto getResult(
            @PathVariable Long gameId) {

        return gameResultService.getResult(gameId);
    }
}