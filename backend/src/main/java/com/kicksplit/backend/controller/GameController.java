package com.kicksplit.backend.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kicksplit.backend.service.GameService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.kicksplit.backend.dto.CreateGameRequest;
import com.kicksplit.backend.dto.GameResponseDto;
import com.kicksplit.backend.entity.Game;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import java.util.List;

@RestController
@RequestMapping("/api/games")
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @GetMapping("/{id}")
    public GameResponseDto getGameById(@PathVariable Long id) {
        Game game = gameService.getGameById(id);
        return GameResponseDto.fromGame(game);
    }

    @GetMapping("/group/{groupId}")
    public List<GameResponseDto> getGamesByGroupId(@PathVariable Long groupId) {
        return gameService.getGamesByGroupId(groupId)
                .stream()
                .map(GameResponseDto::fromGame)
                .toList();
    }

    @PostMapping
    public GameResponseDto createGame(@RequestBody CreateGameRequest request) {
        Game game = gameService.createGame(request);
        return GameResponseDto.fromGame(game);
    }
}