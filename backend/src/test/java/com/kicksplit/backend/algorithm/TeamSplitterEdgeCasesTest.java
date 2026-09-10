package com.kicksplit.backend.algorithm;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

public class TeamSplitterEdgeCasesTest {

    @Test
    void shouldPerfectlyBalancePlayersWithSameRating() {
        List<PlayerCandidate> players = new ArrayList<>();

        for (int i = 1; i <= 9; i++) {
            players.add(new PlayerCandidate("Player " + i, 3));
        }

        TeamSplitter splitter = new TeamSplitter();
        BalanceCalculator calculator = new BalanceCalculator();

        List<List<PlayerCandidate>> teams =
                splitter.split(new ArrayList<>(players));

        assertEquals(3, teams.get(0).size());
        assertEquals(3, teams.get(1).size());
        assertEquals(3, teams.get(2).size());

        assertEquals(0.0, calculator.calculateBalanceScore(teams));
    }
    @Test
void shouldSplitSixteenPlayersIntoSixFiveFive() {
    List<PlayerCandidate> players = new ArrayList<>();

    for (int i = 1; i <= 16; i++) {
        players.add(new PlayerCandidate("Player " + i, (i % 5) + 1));
    }

    TeamSplitter splitter = new TeamSplitter();

    List<List<PlayerCandidate>> teams =
            splitter.split(new ArrayList<>(players));

    assertEquals(6, teams.get(0).size());
    assertEquals(5, teams.get(1).size());
    assertEquals(5, teams.get(2).size());
}

@Test
void shouldRejectLessThanThreePlayers() {
    List<PlayerCandidate> players = new ArrayList<>();

    players.add(new PlayerCandidate("Player 1", 5));
    players.add(new PlayerCandidate("Player 2", 3));

    TeamSplitter splitter = new TeamSplitter();

    assertThrows(IllegalArgumentException.class,
            () -> splitter.split(players));
}

@Test
void shouldSplitExactlyThreePlayers() {
    List<PlayerCandidate> players = new ArrayList<>();

    players.add(new PlayerCandidate("Player 1", 5));
    players.add(new PlayerCandidate("Player 2", 3));
    players.add(new PlayerCandidate("Player 3", 1));

    TeamSplitter splitter = new TeamSplitter();

    List<List<PlayerCandidate>> teams =
            splitter.split(new ArrayList<>(players));

    assertEquals(1, teams.get(0).size());
    assertEquals(1, teams.get(1).size());
    assertEquals(1, teams.get(2).size());
}

@Test
void shouldIncludeEveryPlayerExactlyOnce() {
    List<PlayerCandidate> players = new ArrayList<>();

    for (int i = 1; i <= 15; i++) {
        players.add(new PlayerCandidate("Player " + i, (i % 5) + 1));
    }

    TeamSplitter splitter = new TeamSplitter();

    List<List<PlayerCandidate>> teams =
            splitter.split(new ArrayList<>(players));

    List<PlayerCandidate> allAssignedPlayers = new ArrayList<>();

    for (List<PlayerCandidate> team : teams) {
        allAssignedPlayers.addAll(team);
    }

    assertEquals(players.size(), allAssignedPlayers.size());

    for (PlayerCandidate player : players) {
        assertEquals(1, java.util.Collections.frequency(allAssignedPlayers, player));
    }
}

@Test
void shouldKeepTeamSizesBalancedForDifferentPlayerCounts() {
    TeamSplitter splitter = new TeamSplitter();

    for (int playerCount = 3; playerCount <= 20; playerCount++) {
        List<PlayerCandidate> players = new ArrayList<>();

        for (int i = 1; i <= playerCount; i++) {
            players.add(new PlayerCandidate("Player " + i, (i % 5) + 1));
        }

        List<List<PlayerCandidate>> teams =
                splitter.split(new ArrayList<>(players));

        int minSize = Math.min(
                teams.get(0).size(),
                Math.min(teams.get(1).size(), teams.get(2).size()));

        int maxSize = Math.max(
                teams.get(0).size(),
                Math.max(teams.get(1).size(), teams.get(2).size()));

        assertTrue(maxSize - minSize <= 1);
    }
}


}