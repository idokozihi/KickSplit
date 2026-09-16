package com.kicksplit.backend.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kicksplit.backend.algorithm.PlayerCandidate;
import com.kicksplit.backend.algorithm.TeamProposal;
import com.kicksplit.backend.algorithm.TeamProposalGenerator;
import com.kicksplit.backend.dto.TeamProposalResponseDto;
import com.kicksplit.backend.entity.Game;
import com.kicksplit.backend.entity.Guest;
import com.kicksplit.backend.entity.GroupMember;
import com.kicksplit.backend.entity.Registration;
import com.kicksplit.backend.entity.RegistrationStatus;
import com.kicksplit.backend.entity.StoredProposalPlayer;
import com.kicksplit.backend.entity.StoredTeamProposal;
import com.kicksplit.backend.repository.GameRepository;
import com.kicksplit.backend.repository.GuestRepository;
import com.kicksplit.backend.repository.GroupMemberRepository;
import com.kicksplit.backend.repository.RegistrationRepository;
import com.kicksplit.backend.repository.StoredProposalPlayerRepository;
import com.kicksplit.backend.repository.StoredTeamProposalRepository;

@Service
public class TeamProposalService {

    private final GameRepository gameRepository;
    private final RegistrationRepository registrationRepository;
    private final GuestRepository guestRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final StoredTeamProposalRepository storedTeamProposalRepository;
    private final StoredProposalPlayerRepository storedProposalPlayerRepository;

    public TeamProposalService(
            GameRepository gameRepository,
            RegistrationRepository registrationRepository,
            GuestRepository guestRepository,
            GroupMemberRepository groupMemberRepository,
            StoredTeamProposalRepository storedTeamProposalRepository,
            StoredProposalPlayerRepository storedProposalPlayerRepository) {

        this.gameRepository = gameRepository;
        this.registrationRepository = registrationRepository;
        this.guestRepository = guestRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.storedTeamProposalRepository = storedTeamProposalRepository;
        this.storedProposalPlayerRepository = storedProposalPlayerRepository;
    }

    @Transactional
    public List<TeamProposalResponseDto> getOrGenerateProposals(Long gameId) {

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));

        List<StoredTeamProposal> existing =
                storedTeamProposalRepository.findByGame_IdOrderByProposalNumber(gameId);

        if (!existing.isEmpty()) {
            return existing.stream()
                    .map(this::toResponseDto)
                    .toList();
        }

        List<PlayerCandidate> players = collectPlayers(game);

        TeamProposalGenerator generator = new TeamProposalGenerator();
        List<TeamProposal> generated = generator.generateProposals(players);

        List<TeamProposalResponseDto> responses = new ArrayList<>();

        for (int proposalIndex = 0; proposalIndex < generated.size(); proposalIndex++) {

            TeamProposal proposal = generated.get(proposalIndex);

            StoredTeamProposal storedProposal =
                    storedTeamProposalRepository.save(
                            new StoredTeamProposal(
                                    game,
                                    proposalIndex + 1,
                                    proposal.getBalanceScore()));

            for (int teamIndex = 0; teamIndex < proposal.getTeams().size(); teamIndex++) {

                for (PlayerCandidate player : proposal.getTeams().get(teamIndex)) {

                    storedProposalPlayerRepository.save(
        new StoredProposalPlayer(
                storedProposal,
                teamIndex + 1,
                player.getUserId(),
                player.getName(),
                player.getRating()));
                }
            }

            responses.add(toResponseDto(storedProposal));
        }

        return responses;
    }

    private List<PlayerCandidate> collectPlayers(Game game) {

        List<PlayerCandidate> players = new ArrayList<>();

        List<Registration> registrations =
                registrationRepository.findByGame_Id(game.getId());

        for (Registration registration : registrations) {

            if (registration.getStatus() != RegistrationStatus.AVAILABLE) {
                continue;
            }

            GroupMember membership = groupMemberRepository
                    .findByUser_IdAndGroup_Id(
                            registration.getUser().getId(),
                            game.getGroup().getId())
                    .orElseThrow(() -> new RuntimeException("Group member not found"));

           players.add(new PlayerCandidate(
                registration.getUser().getId(),
                registration.getUser().getName(),
                membership.getSelfOverallRating()));
        }

        List<Guest> guests = guestRepository.findByGame_Id(game.getId());

        for (Guest guest : guests) {
            players.add(new PlayerCandidate(
                    guest.getName(),
                    guest.getRating()));
        }

        return players;
    }

    private TeamProposalResponseDto toResponseDto(StoredTeamProposal proposal) {

        List<List<PlayerCandidate>> teams = new ArrayList<>();

        teams.add(new ArrayList<>());
        teams.add(new ArrayList<>());
        teams.add(new ArrayList<>());

        List<StoredProposalPlayer> players =
                storedProposalPlayerRepository
                        .findByProposal_IdOrderByTeamNumber(proposal.getId());

        for (StoredProposalPlayer player : players) {
            teams.get(player.getTeamNumber() - 1)
                    .add(new PlayerCandidate(
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