package com.kicksplit.backend.algorithm;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.HashSet;
import java.util.Set;

public class TeamProposalGeneratorTest {

    @Test
    void shouldGenerateThreeProposals() {
        List<PlayerCandidate> players = new ArrayList<>();

        players.add(new PlayerCandidate("Player 1", 5));
        players.add(new PlayerCandidate("Player 2", 5));
        players.add(new PlayerCandidate("Player 3", 4));
        players.add(new PlayerCandidate("Player 4", 4));
        players.add(new PlayerCandidate("Player 5", 3));
        players.add(new PlayerCandidate("Player 6", 3));
        players.add(new PlayerCandidate("Player 7", 2));
        players.add(new PlayerCandidate("Player 8", 2));
        players.add(new PlayerCandidate("Player 9", 1));

        TeamProposalGenerator generator = new TeamProposalGenerator();

        List<TeamProposal> proposals = generator.generateProposals(players);

        assertEquals(3, proposals.size());

        assertTrue(proposals.get(0).getBalanceScore() <= proposals.get(1).getBalanceScore());

        assertTrue(proposals.get(1).getBalanceScore() <= proposals.get(2).getBalanceScore());

        Set<String> proposalKeys = new HashSet<>();

        for (TeamProposal proposal : proposals) {
            List<String> teamKeys = new ArrayList<>();

            for (List<PlayerCandidate> team : proposal.getTeams()) {
                List<String> names = new ArrayList<>();

                for (PlayerCandidate player : team) {
                    names.add(player.getName());
                }

                names.sort(String::compareTo);
                teamKeys.add(String.join(",", names));
            }

            teamKeys.sort(String::compareTo);
            proposalKeys.add(String.join("|", teamKeys));
        }

        assertEquals(3, proposalKeys.size());
    }
}