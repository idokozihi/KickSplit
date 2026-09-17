package com.kicksplit.backend.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kicksplit.backend.entity.GameResult;
import com.kicksplit.backend.entity.GroupMember;
import com.kicksplit.backend.entity.StoredProposalPlayer;
import com.kicksplit.backend.repository.GameResultRepository;
import com.kicksplit.backend.repository.GroupMemberRepository;
import com.kicksplit.backend.repository.StoredProposalPlayerRepository;

@Service
public class RatingRecalculationService {

    private static final double BASE_K = 0.8;
    private static final double MIN_RATING = 1.0;
    private static final double MAX_RATING = 5.0;

    private final GameResultRepository gameResultRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final StoredProposalPlayerRepository proposalPlayerRepository;

    public RatingRecalculationService(
            GameResultRepository gameResultRepository,
            GroupMemberRepository groupMemberRepository,
            StoredProposalPlayerRepository proposalPlayerRepository) {

        this.gameResultRepository = gameResultRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.proposalPlayerRepository = proposalPlayerRepository;
    }

    @Transactional
    public void recalculateGroup(Long groupId) {

        List<GroupMember> members =
                groupMemberRepository.findByGroup_Id(groupId);

        Map<Long, GroupMember> membersByUserId = new HashMap<>();

        for (GroupMember member : members) {
            member.setAppRating(member.getSelfOverallRating());
            member.setRatedGames(0);
            member.setTotalWins(0);
            member.setTotalRecordedWins(0);

            membersByUserId.put(
                    member.getUser().getId(),
                    member);
        }

        List<GameResult> results =
                gameResultRepository
                        .findByGame_Group_IdOrderByGame_DateAscGame_IdAsc(groupId);

        for (GameResult result : results) {
            applyResult(result, membersByUserId);
        }

        groupMemberRepository.saveAll(members);
    }

    private void applyResult(
            GameResult result,
            Map<Long, GroupMember> membersByUserId) {

        List<StoredProposalPlayer> players =
                proposalPlayerRepository
                        .findByProposal_IdOrderByTeamNumber(
                                result.getProposal().getId());

        Map<Integer, List<StoredProposalPlayer>> teams =
                Map.of(
                        1, players.stream()
                                .filter(player -> player.getTeamNumber() == 1)
                                .toList(),
                        2, players.stream()
                                .filter(player -> player.getTeamNumber() == 2)
                                .toList(),
                        3, players.stream()
                                .filter(player -> player.getTeamNumber() == 3)
                                .toList());

        double team1Strength =
                calculateTeamStrength(teams.get(1), membersByUserId);

        double team2Strength =
                calculateTeamStrength(teams.get(2), membersByUserId);

        double team3Strength =
                calculateTeamStrength(teams.get(3), membersByUserId);

        double totalStrength =
                team1Strength + team2Strength + team3Strength;

        int totalWins =
                result.getTeam1Wins()
                        + result.getTeam2Wins()
                        + result.getTeam3Wins();

        if (totalStrength <= 0) {
            return;
        }

        updateTeam(
                teams.get(1),
                result.getTeam1Wins(),
                totalWins,
                team1Strength / totalStrength,
                membersByUserId);

        updateTeam(
                teams.get(2),
                result.getTeam2Wins(),
                totalWins,
                team2Strength / totalStrength,
                membersByUserId);

        updateTeam(
                teams.get(3),
                result.getTeam3Wins(),
                totalWins,
                team3Strength / totalStrength,
                membersByUserId);
    }

    private double calculateTeamStrength(
            List<StoredProposalPlayer> team,
            Map<Long, GroupMember> membersByUserId) {

        if (team.isEmpty()) {
            return 0.0;
        }

        double totalRating = 0.0;

        for (StoredProposalPlayer player : team) {

            if (player.getUserId() != null
                    && membersByUserId.containsKey(player.getUserId())) {

                totalRating += membersByUserId
                        .get(player.getUserId())
                        .getAppRating();

            } else {
                // Guest: use the rating stored when the proposal was created.
                totalRating += player.getRating();
            }
        }

        return totalRating / team.size();
    }

    private void updateTeam(
            List<StoredProposalPlayer> team,
            int teamWins,
            int totalWins,
            double expectedShare,
            Map<Long, GroupMember> membersByUserId) {

        double actualShare =
                totalWins == 0
                        ? expectedShare
                        : (double) teamWins / totalWins;

        for (StoredProposalPlayer player : team) {

            if (player.getUserId() == null) {
                continue;
            }

            GroupMember member =
                    membersByUserId.get(player.getUserId());

            if (member == null) {
                continue;
            }

            int gamesBefore = member.getRatedGames();

            double k =
                    BASE_K / Math.sqrt(gamesBefore + 1.0);

            double change =
                    k * (actualShare - expectedShare);

            double newRating =
                    clamp(member.getAppRating() + change);

            member.setAppRating(newRating);
            member.setRatedGames(gamesBefore + 1);
            member.setTotalWins(
                    member.getTotalWins() + teamWins);
            member.setTotalRecordedWins(
                    member.getTotalRecordedWins() + totalWins);
        }
    }

    private double clamp(double rating) {
        return Math.max(
                MIN_RATING,
                Math.min(MAX_RATING, rating));
    }
}