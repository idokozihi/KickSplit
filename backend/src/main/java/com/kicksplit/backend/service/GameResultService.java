package com.kicksplit.backend.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.kicksplit.backend.dto.GameResultRequest;
import com.kicksplit.backend.dto.GameResultResponseDto;
import com.kicksplit.backend.entity.Game;
import com.kicksplit.backend.entity.GameResult;
import com.kicksplit.backend.entity.GroupMember;
import com.kicksplit.backend.entity.Registration;
import com.kicksplit.backend.entity.RegistrationStatus;
import com.kicksplit.backend.entity.StoredTeamProposal;
import com.kicksplit.backend.entity.User;
import com.kicksplit.backend.repository.GameRepository;
import com.kicksplit.backend.repository.GameResultRepository;
import com.kicksplit.backend.repository.GroupMemberRepository;
import com.kicksplit.backend.repository.RegistrationRepository;
import com.kicksplit.backend.repository.StoredTeamProposalRepository;
import com.kicksplit.backend.repository.UserRepository;

@Service
public class GameResultService {

    private final GameResultRepository gameResultRepository;
    private final GameRepository gameRepository;
    private final StoredTeamProposalRepository proposalRepository;
    private final RegistrationRepository registrationRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;
    private final RatingRecalculationService ratingRecalculationService;

    public GameResultService(
            GameResultRepository gameResultRepository,
            GameRepository gameRepository,
            StoredTeamProposalRepository proposalRepository,
            RegistrationRepository registrationRepository,
            GroupMemberRepository groupMemberRepository,
            UserRepository userRepository,
            RatingRecalculationService ratingRecalculationService) {

        this.gameResultRepository = gameResultRepository;
        this.gameRepository = gameRepository;
        this.proposalRepository = proposalRepository;
        this.registrationRepository = registrationRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.userRepository = userRepository;
        this.ratingRecalculationService = ratingRecalculationService;
    }

    @Transactional
    public GameResultResponseDto saveResult(
            Long gameId,
            GameResultRequest request) {

        if (request.team1Wins() < 0
                || request.team2Wins() < 0
                || request.team3Wins() < 0) {
            throw new RuntimeException("Wins cannot be negative");
        }

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));

        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        StoredTeamProposal proposal = proposalRepository
                .findById(request.proposalId())
                .orElseThrow(() -> new RuntimeException("Proposal not found"));

        if (!proposal.getGame().getId().equals(gameId)) {
            throw new RuntimeException(
                    "Proposal does not belong to this game");
        }

        GameResult existing = gameResultRepository
                .findByGame_Id(gameId)
                .orElse(null);

        GameResult savedResult;

        if (existing == null) {

            Registration registration = registrationRepository
                    .findByUser_IdAndGame_Id(user.getId(), gameId)
                    .orElseThrow(() ->
                            new RuntimeException("User is not a participant"));

            if (registration.getStatus() != RegistrationStatus.AVAILABLE) {
                throw new RuntimeException(
                        "Only available participants can enter results");
            }

            GameResult result = new GameResult(
                    game,
                    proposal,
                    user,
                    request.team1Wins(),
                    request.team2Wins(),
                    request.team3Wins());

            savedResult = gameResultRepository.saveAndFlush(result);

        } else {

            boolean isOriginalEditor =
                    existing.getEnteredBy().getId().equals(user.getId());

            GroupMember membership = groupMemberRepository
                    .findByUser_IdAndGroup_Id(
                            user.getId(),
                            game.getGroup().getId())
                    .orElse(null);

            boolean isAdmin =
                    membership != null && membership.isAdmin();

            if (!isOriginalEditor && !isAdmin) {
                throw new RuntimeException(
                        "Only the original editor or an admin can edit results");
            }

            existing.setProposal(proposal);
            existing.setTeam1Wins(request.team1Wins());
            existing.setTeam2Wins(request.team2Wins());
            existing.setTeam3Wins(request.team3Wins());

            savedResult = gameResultRepository.saveAndFlush(existing);
        }

        ratingRecalculationService.recalculateGroup(
                game.getGroup().getId());

        return toDto(savedResult);
    }

    public GameResultResponseDto getResult(Long gameId) {

        GameResult result = gameResultRepository
                .findByGame_Id(gameId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Game result not found"));

        return toDto(result);
    }

    private GameResultResponseDto toDto(GameResult result) {

        return new GameResultResponseDto(
                result.getId(),
                result.getGame().getId(),
                result.getProposal().getId(),
                result.getEnteredBy().getId(),
                result.getTeam1Wins(),
                result.getTeam2Wins(),
                result.getTeam3Wins());
    }
}