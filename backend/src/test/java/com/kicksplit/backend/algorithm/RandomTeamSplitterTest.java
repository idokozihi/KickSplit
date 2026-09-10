package com.kicksplit.backend.algorithm;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

public class RandomTeamSplitterTest {

    @Test
    void shouldSplitPlayersIntoThreeTeams() {
        List<PlayerCandidate> players = new ArrayList<>();

        for (int i = 1; i <= 14; i++) {
            players.add(new PlayerCandidate("Player " + i, (i % 5) + 1));
        }

        RandomTeamSplitter splitter = new RandomTeamSplitter();

        List<List<PlayerCandidate>> teams = splitter.split(players);

        assertEquals(3, teams.size());
        assertEquals(5, teams.get(0).size());
        assertEquals(5, teams.get(1).size());
        assertEquals(4, teams.get(2).size());
    }
}