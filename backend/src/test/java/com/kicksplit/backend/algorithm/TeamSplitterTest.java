package com.kicksplit.backend.algorithm;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

public class TeamSplitterTest {

    @Test
    void shouldSplitPlayersIntoBalancedTeams() {
        List<PlayerCandidate> players = new ArrayList<>();

        players.add(new PlayerCandidate("Player 1", 5));
        players.add(new PlayerCandidate("Player 2", 5));
        players.add(new PlayerCandidate("Player 3", 4));
        players.add(new PlayerCandidate("Player 4", 3));
        players.add(new PlayerCandidate("Player 5", 2));
        players.add(new PlayerCandidate("Player 6", 1));

        TeamSplitter splitter = new TeamSplitter();

        List<List<PlayerCandidate>> teams = splitter.split(players);

        assertEquals(3, teams.size());
        assertEquals(2, teams.get(0).size());
        assertEquals(2, teams.get(1).size());
        assertEquals(2, teams.get(2).size());

        int[] sums = new int[3];

        for (int i = 0; i < 3; i++) {
            for (PlayerCandidate player : teams.get(i)) {
                sums[i] += player.getRating();
            }
        }

        java.util.Arrays.sort(sums);

        assertEquals(6, sums[0]);
        assertEquals(7, sums[1]);
        assertEquals(7, sums[2]);
    }

    @Test
    void shouldSplitFourteenPlayersIntoFiveFiveFour() {
        List<PlayerCandidate> players = new ArrayList<>();

        for (int i = 1; i <= 14; i++) {
            players.add(new PlayerCandidate("Player " + i, (i % 5) + 1));
        }

        TeamSplitter splitter = new TeamSplitter();

        List<List<PlayerCandidate>> teams = splitter.split(players);

        assertEquals(5, teams.get(0).size());
        assertEquals(5, teams.get(1).size());
        assertEquals(4, teams.get(2).size());
    }

}