package com.kicksplit.backend.service;

import org.springframework.stereotype.Service;

import com.kicksplit.backend.repository.GameRepository;
import com.kicksplit.backend.repository.GuestRepository;
import com.kicksplit.backend.repository.GroupMemberRepository;
import com.kicksplit.backend.repository.RegistrationRepository;

import java.util.ArrayList;
import java.util.List;

import com.kicksplit.backend.algorithm.PlayerCandidate;
import com.kicksplit.backend.algorithm.TeamProposal;
import com.kicksplit.backend.algorithm.TeamProposalGenerator;
import com.kicksplit.backend.entity.Game;
import com.kicksplit.backend.entity.Guest;
import com.kicksplit.backend.entity.GroupMember;
import com.kicksplit.backend.entity.Registration;
import com.kicksplit.backend.entity.RegistrationStatus;

@Service
public class TeamProposalService {

    private final GameRepository gameRepository;
    private final RegistrationRepository registrationRepository;
    private final GuestRepository guestRepository;
    private final GroupMemberRepository groupMemberRepository;

    public TeamProposalService(
            GameRepository gameRepository,
            RegistrationRepository registrationRepository,
            GuestRepository guestRepository,
            GroupMemberRepository groupMemberRepository) {

        this.gameRepository = gameRepository;
        this.registrationRepository = registrationRepository;
        this.guestRepository = guestRepository;
        this.groupMemberRepository = groupMemberRepository;
    }

    public List<TeamProposal> generateProposals(Long gameId) {

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));

        List<PlayerCandidate> players = new ArrayList<>();

        List<Registration> registrations = registrationRepository.findByGame_Id(gameId);

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
                    registration.getUser().getName(),
                    membership.getSelfOverallRating()));
        }

        List<Guest> guests = guestRepository.findByGame_Id(gameId);

        for (Guest guest : guests) {
            players.add(new PlayerCandidate(
                    guest.getName(),
                    guest.getRating()));
        }

        TeamProposalGenerator generator = new TeamProposalGenerator();

        return generator.generateProposals(players);
    }
}