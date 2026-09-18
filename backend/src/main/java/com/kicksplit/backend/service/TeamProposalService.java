package com.kicksplit.backend.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.kicksplit.backend.algorithm.PlayerCandidate;
import com.kicksplit.backend.algorithm.TeamProposal;
import com.kicksplit.backend.algorithm.TeamProposalGenerator;
import com.kicksplit.backend.dto.RegenerationVoteResponseDto;
import com.kicksplit.backend.dto.TeamProposalResponseDto;
import com.kicksplit.backend.entity.Game;
import com.kicksplit.backend.entity.Guest;
import com.kicksplit.backend.entity.GroupMember;
import com.kicksplit.backend.entity.RatingSource;
import com.kicksplit.backend.entity.Registration;
import com.kicksplit.backend.entity.RegistrationStatus;
import com.kicksplit.backend.entity.StoredProposalPlayer;
import com.kicksplit.backend.entity.StoredTeamProposal;
import com.kicksplit.backend.entity.TeamRegenerationVote;
import com.kicksplit.backend.repository.GameRepository;
import com.kicksplit.backend.repository.GameResultRepository;
import com.kicksplit.backend.repository.GuestRepository;
import com.kicksplit.backend.repository.GroupMemberRepository;
import com.kicksplit.backend.repository.RegistrationRepository;
import com.kicksplit.backend.repository.StoredProposalPlayerRepository;
import com.kicksplit.backend.repository.StoredTeamProposalRepository;
import com.kicksplit.backend.repository.TeamRegenerationVoteRepository;
import com.kicksplit.backend.repository.VoteRepository;

@Service
public class TeamProposalService {

    private static final int MAX_REQUIRED_REGENERATION_VOTES = 6;

    private final GameRepository gameRepository;
    private final RegistrationRepository registrationRepository;
    private final GuestRepository guestRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final StoredTeamProposalRepository storedTeamProposalRepository;
    private final StoredProposalPlayerRepository storedProposalPlayerRepository;
    private final VoteRepository voteRepository;
    private final GameResultRepository gameResultRepository;
    private final TeamRegenerationVoteRepository teamRegenerationVoteRepository;

    public TeamProposalService(
            GameRepository gameRepository,
            RegistrationRepository registrationRepository,
            GuestRepository guestRepository,
            GroupMemberRepository groupMemberRepository,
            StoredTeamProposalRepository storedTeamProposalRepository,
            StoredProposalPlayerRepository storedProposalPlayerRepository,
            VoteRepository voteRepository,
            GameResultRepository gameResultRepository,
            TeamRegenerationVoteRepository teamRegenerationVoteRepository) {

        this.gameRepository = gameRepository;
        this.registrationRepository = registrationRepository;
        this.guestRepository = guestRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.storedTeamProposalRepository = storedTeamProposalRepository;
        this.storedProposalPlayerRepository = storedProposalPlayerRepository;
        this.voteRepository = voteRepository;
        this.gameResultRepository = gameResultRepository;
        this.teamRegenerationVoteRepository = teamRegenerationVoteRepository;
    }

    @Transactional
    public List<TeamProposalResponseDto> getOrGenerateProposals(Long gameId) {

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));

        List<StoredTeamProposal> existing =
                storedTeamProposalRepository
                        .findByGame_IdOrderByProposalNumber(gameId);

        if (!existing.isEmpty()) {
            return existing.stream()
                    .map(this::toResponseDto)
                    .toList();
        }

        return generateAndStoreProposals(game);
    }

    @Transactional(readOnly = true)
    public RegenerationVoteResponseDto getRegenerationVoteStatus(
            Long gameId,
            Long userId) {

        gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));

        List<Registration> availableRegistrations =
                getAvailableRegistrations(gameId);

        int requiredVotes = Math.min(
                MAX_REQUIRED_REGENERATION_VOTES,
                availableRegistrations.size());

        boolean blockedByResult =
                gameResultRepository.findByGame_Id(gameId).isPresent();

        boolean eligible =
                !blockedByResult
                        && userId != null
                        && isAvailableUser(
                                availableRegistrations,
                                userId);

        boolean currentUserVoted =
                userId != null
                        && teamRegenerationVoteRepository
                                .findByUser_IdAndGame_Id(
                                        userId,
                                        gameId)
                                .isPresent();

        int voteCount = Math.toIntExact(
                teamRegenerationVoteRepository
                        .countByGame_Id(gameId));

        List<TeamProposalResponseDto> proposals =
                storedTeamProposalRepository
                        .findByGame_IdOrderByProposalNumber(gameId)
                        .stream()
                        .map(this::toResponseDto)
                        .toList();

        return new RegenerationVoteResponseDto(
                voteCount,
                requiredVotes,
                currentUserVoted,
                eligible,
                blockedByResult,
                false,
                proposals);
    }

    @Transactional
    public RegenerationVoteResponseDto voteForRegeneration(
            Long gameId,
            Long userId) {

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));

        if (gameResultRepository.findByGame_Id(gameId).isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot request new teams after a game result has been recorded.");
        }

        List<StoredTeamProposal> existing =
                storedTeamProposalRepository
                        .findByGame_IdOrderByProposalNumber(gameId);

        if (existing.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "There are no existing team proposals to regenerate.");
        }

        List<Registration> availableRegistrations =
                getAvailableRegistrations(gameId);

        Registration registration =
                availableRegistrations.stream()
                        .filter(item ->
                                item.getUser()
                                        .getId()
                                        .equals(userId))
                        .findFirst()
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "Only available players can vote for new teams."));

        int requiredVotes = Math.min(
                MAX_REQUIRED_REGENERATION_VOTES,
                availableRegistrations.size());

        boolean alreadyVoted =
                teamRegenerationVoteRepository
                        .findByUser_IdAndGame_Id(
                                userId,
                                gameId)
                        .isPresent();

        if (!alreadyVoted) {
            teamRegenerationVoteRepository.save(
                    new TeamRegenerationVote(
                            registration.getUser(),
                            game));

            teamRegenerationVoteRepository.flush();
        }

        int voteCount = Math.toIntExact(
                teamRegenerationVoteRepository
                        .countByGame_Id(gameId));

        if (requiredVotes > 0
                && voteCount >= requiredVotes) {

            List<TeamProposalResponseDto> regenerated =
                    regenerateProposals(game, existing);

            return new RegenerationVoteResponseDto(
                    0,
                    requiredVotes,
                    false,
                    true,
                    false,
                    true,
                    regenerated);
        }

        return new RegenerationVoteResponseDto(
                voteCount,
                requiredVotes,
                true,
                true,
                false,
                false,
                existing.stream()
                        .map(this::toResponseDto)
                        .toList());
    }

    private List<TeamProposalResponseDto> regenerateProposals(
            Game game,
            List<StoredTeamProposal> existing) {

        Long gameId = game.getId();

        /*
         * Existing votes point to the old proposals,
         * so they must be removed first.
         */
        voteRepository.deleteByGame_Id(gameId);
        voteRepository.flush();

        /*
         * Proposal players reference their proposal,
         * so remove them before deleting proposals.
         */
        for (StoredTeamProposal proposal : existing) {
            storedProposalPlayerRepository
                    .deleteByProposal_Id(proposal.getId());
        }

        storedProposalPlayerRepository.flush();

        storedTeamProposalRepository.deleteAll(existing);
        storedTeamProposalRepository.flush();

        /*
         * A successful regeneration starts a fresh
         * regeneration-vote cycle.
         */
        teamRegenerationVoteRepository.deleteByGame_Id(gameId);
        teamRegenerationVoteRepository.flush();

        return generateAndStoreProposals(game);
    }

    private List<TeamProposalResponseDto> generateAndStoreProposals(
            Game game) {

        List<PlayerCandidate> players =
                collectPlayers(game);

        TeamProposalGenerator generator =
                new TeamProposalGenerator();

        List<TeamProposal> generated =
                generator.generateProposals(players);

        List<TeamProposalResponseDto> responses =
                new ArrayList<>();

        for (int proposalIndex = 0;
             proposalIndex < generated.size();
             proposalIndex++) {

            TeamProposal proposal =
                    generated.get(proposalIndex);

            StoredTeamProposal storedProposal =
                    storedTeamProposalRepository.save(
                            new StoredTeamProposal(
                                    game,
                                    proposalIndex + 1,
                                    proposal.getBalanceScore()));

            for (int teamIndex = 0;
                 teamIndex < proposal.getTeams().size();
                 teamIndex++) {

                for (PlayerCandidate player :
                        proposal.getTeams()
                                .get(teamIndex)) {

                    storedProposalPlayerRepository.save(
                            new StoredProposalPlayer(
                                    storedProposal,
                                    teamIndex + 1,
                                    player.getUserId(),
                                    player.getName(),
                                    player.getRating()));
                }
            }

            responses.add(
                    toResponseDto(storedProposal));
        }

        return responses;
    }

    private List<Registration> getAvailableRegistrations(
            Long gameId) {

        return registrationRepository
                .findByGame_Id(gameId)
                .stream()
                .filter(registration ->
                        registration.getStatus()
                                == RegistrationStatus.AVAILABLE)
                .toList();
    }

    private boolean isAvailableUser(
            List<Registration> availableRegistrations,
            Long userId) {

        return availableRegistrations.stream()
                .anyMatch(registration ->
                        registration.getUser()
                                .getId()
                                .equals(userId));
    }

    private List<PlayerCandidate> collectPlayers(
            Game game) {

        List<PlayerCandidate> players =
                new ArrayList<>();

        List<Registration> registrations =
                registrationRepository
                        .findByGame_Id(game.getId());

        for (Registration registration :
                registrations) {

            if (registration.getStatus()
                    != RegistrationStatus.AVAILABLE) {
                continue;
            }

            GroupMember membership =
                    groupMemberRepository
                            .findByUser_IdAndGroup_Id(
                                    registration
                                            .getUser()
                                            .getId(),
                                    game.getGroup()
                                            .getId())
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Group member not found"));

            double rating;

            if (game.getGroup().getRatingSource()
                    == RatingSource.APP_RATING) {

                rating =
                        membership.getAppRating();

            } else {

                rating =
                        membership
                                .getSelfOverallRating();
            }

            players.add(
                    new PlayerCandidate(
                            registration
                                    .getUser()
                                    .getId(),
                            registration
                                    .getUser()
                                    .getName(),
                            rating));
        }

        List<Guest> guests =
                guestRepository
                        .findByGame_Id(game.getId());

        for (Guest guest : guests) {
            players.add(
                    new PlayerCandidate(
                            guest.getName(),
                            guest.getRating()));
        }

        return players;
    }

    private TeamProposalResponseDto toResponseDto(
            StoredTeamProposal proposal) {

        List<List<PlayerCandidate>> teams =
                new ArrayList<>();

        teams.add(new ArrayList<>());
        teams.add(new ArrayList<>());
        teams.add(new ArrayList<>());

        List<StoredProposalPlayer> players =
                storedProposalPlayerRepository
                        .findByProposal_IdOrderByTeamNumber(
                                proposal.getId());

        for (StoredProposalPlayer player :
                players) {

            teams.get(
                    player.getTeamNumber() - 1)
                    .add(
                            new PlayerCandidate(
                                    player.getUserId(),
                                    player.getName(),
                                    player.getRating()));
        }

        return new TeamProposalResponseDto(
                proposal.getId(),
                proposal.getProposalNumber(),
                teams,
                proposal.getBalanceScore());
    }
}