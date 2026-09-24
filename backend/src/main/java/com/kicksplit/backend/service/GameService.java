package com.kicksplit.backend.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.kicksplit.backend.dto.CreateGameRequest;
import com.kicksplit.backend.entity.Game;
import com.kicksplit.backend.entity.Group;
import com.kicksplit.backend.entity.GroupMember;
import com.kicksplit.backend.entity.StoredTeamProposal;
import com.kicksplit.backend.entity.User;
import com.kicksplit.backend.repository.GameRepository;
import com.kicksplit.backend.repository.GameResultRepository;
import com.kicksplit.backend.repository.GroupMemberRepository;
import com.kicksplit.backend.repository.GroupRepository;
import com.kicksplit.backend.repository.GuestRepository;
import com.kicksplit.backend.repository.RegistrationRepository;
import com.kicksplit.backend.repository.StoredProposalPlayerRepository;
import com.kicksplit.backend.repository.StoredTeamProposalRepository;
import com.kicksplit.backend.repository.TeamRegenerationVoteRepository;
import com.kicksplit.backend.repository.UserRepository;
import com.kicksplit.backend.repository.VoteRepository;

@Service
public class GameService {

    private final GameRepository gameRepository;
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GameResultRepository gameResultRepository;
    private final RegistrationRepository registrationRepository;
    private final GuestRepository guestRepository;
    private final StoredTeamProposalRepository storedTeamProposalRepository;
    private final StoredProposalPlayerRepository storedProposalPlayerRepository;
    private final VoteRepository voteRepository;
    private final TeamRegenerationVoteRepository teamRegenerationVoteRepository;

    public GameService(
            GameRepository gameRepository,
            GroupRepository groupRepository,
            UserRepository userRepository,
            GroupMemberRepository groupMemberRepository,
            GameResultRepository gameResultRepository,
            RegistrationRepository registrationRepository,
            GuestRepository guestRepository,
            StoredTeamProposalRepository storedTeamProposalRepository,
            StoredProposalPlayerRepository storedProposalPlayerRepository,
            VoteRepository voteRepository,
            TeamRegenerationVoteRepository teamRegenerationVoteRepository) {

        this.gameRepository = gameRepository;
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.gameResultRepository = gameResultRepository;
        this.registrationRepository = registrationRepository;
        this.guestRepository = guestRepository;
        this.storedTeamProposalRepository = storedTeamProposalRepository;
        this.storedProposalPlayerRepository = storedProposalPlayerRepository;
        this.voteRepository = voteRepository;
        this.teamRegenerationVoteRepository = teamRegenerationVoteRepository;
    }

    @Transactional
    public Game createGame(CreateGameRequest request) {

        if (request.getGroupId() == null || request.getUserId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Group and current user are required.");
        }

        Group group = groupRepository.findById(request.getGroupId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Group not found."));

        User creator = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found."));

        groupMemberRepository
                .findByUser_IdAndGroup_Id(creator.getId(), group.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Only group members can create games."));

        int targetPlayers = request.getTargetPlayers() > 0
                ? request.getTargetPlayers()
                : 15;

        Game game = new Game(
                group,
                creator,
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

    @Transactional
    public void deleteGame(Long gameId, Long userId) {

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));

        GroupMember membership = groupMemberRepository
                .findByUser_IdAndGroup_Id(
                        userId,
                        game.getGroup().getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "User is not a member of this group."));

        boolean creator =
                game.getCreatedBy() != null
                        && game.getCreatedBy().getId().equals(userId);

        if (!membership.isAdmin() && !creator) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only an admin or the game creator can delete this game.");
        }

        if (gameResultRepository.findByGame_Id(gameId).isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A game with a recorded result cannot be deleted.");
        }

        voteRepository.deleteByGame_Id(gameId);
        voteRepository.flush();

        teamRegenerationVoteRepository.deleteByGame_Id(gameId);
        teamRegenerationVoteRepository.flush();

        List<StoredTeamProposal> proposals =
                storedTeamProposalRepository
                        .findByGame_IdOrderByProposalNumber(gameId);

        for (StoredTeamProposal proposal : proposals) {
            storedProposalPlayerRepository
                    .deleteByProposal_Id(proposal.getId());
        }

        storedProposalPlayerRepository.flush();

        storedTeamProposalRepository.deleteAll(proposals);
        storedTeamProposalRepository.flush();

        guestRepository.deleteAll(
                guestRepository.findByGame_Id(gameId));
        guestRepository.flush();

        registrationRepository.deleteAll(
                registrationRepository.findByGame_Id(gameId));
        registrationRepository.flush();

        gameRepository.delete(game);
        gameRepository.flush();
    }
}
