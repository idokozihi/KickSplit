package com.kicksplit.backend.service;

import org.springframework.stereotype.Service;

import com.kicksplit.backend.repository.GameRepository;
import com.kicksplit.backend.repository.GroupRepository;
import com.kicksplit.backend.dto.CreateGameRequest;
import com.kicksplit.backend.entity.Game;
import com.kicksplit.backend.entity.Group;
import java.util.List;

@Service
public class GameService {

    private final GameRepository gameRepository;
    private final GroupRepository groupRepository;

    public GameService(
            GameRepository gameRepository,
            GroupRepository groupRepository) {
        this.gameRepository = gameRepository;
        this.groupRepository = groupRepository;
    }

    public Game createGame(CreateGameRequest request) {

        Group group = groupRepository.findById(request.getGroupId())
                .orElseThrow(() -> new RuntimeException("Group not found"));

        int targetPlayers = request.getTargetPlayers() > 0
                ? request.getTargetPlayers()
                : 15;

        Game game = new Game(
                group,
                request.getName(),
                request.getDate(),
                request.getTime(),
                targetPlayers);

        return gameRepository.save(game);
    }

    public List<Game> getGamesByGroupId(Long groupId) {
        return gameRepository.findByGroup_Id(groupId);
    }

    public Game getGameById(Long id) {
        return gameRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Game not found"));
    }
}