package com.kicksplit.backend.algorithm;

import java.util.ArrayList;
import java.util.List;

import java.util.HashSet;
import java.util.Set;

public class TeamProposalGenerator {

    private final TeamSplitter teamSplitter;
    private final BalanceCalculator balanceCalculator;

    public TeamProposalGenerator() {
        this.teamSplitter = new TeamSplitter();
        this.balanceCalculator = new BalanceCalculator();
    }

    public List<TeamProposal> generateProposals(List<PlayerCandidate> players) {
        List<TeamProposal> proposals = new ArrayList<>();
        Set<String> seenProposals = new HashSet<>();

        for (int i = 0; i < 100; i++) {
            List<PlayerCandidate> playersCopy = new ArrayList<>(players);

            List<List<PlayerCandidate>> teams = teamSplitter.split(playersCopy);

            double score = balanceCalculator.calculateBalanceScore(teams);

            String proposalKey = createProposalKey(teams);

            if (seenProposals.add(proposalKey)) {
                proposals.add(new TeamProposal(teams, score));
            }
        }

        proposals.sort((a, b) -> Double.compare(a.getBalanceScore(), b.getBalanceScore()));

        return proposals.subList(0, Math.min(3, proposals.size()));
    }

    private String createProposalKey(List<List<PlayerCandidate>> teams) {
        List<String> teamKeys = new ArrayList<>();

        for (List<PlayerCandidate> team : teams) {
            List<String> playerNames = new ArrayList<>();

            for (PlayerCandidate player : team) {
                playerNames.add(player.getName());
            }

            playerNames.sort(String::compareTo);
            teamKeys.add(String.join(",", playerNames));
        }

        teamKeys.sort(String::compareTo);

        return String.join("|", teamKeys);
    }

}