package com.kicksplit.backend.algorithm;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

public class AlgorithmComparisonTest {

    @Test
    void greedyShouldBeBetterThanRandomOnAverage() {
        List<PlayerCandidate> players = new ArrayList<>();

        players.add(new PlayerCandidate("P1", 5));
        players.add(new PlayerCandidate("P2", 5));
        players.add(new PlayerCandidate("P3", 5));
        players.add(new PlayerCandidate("P4", 5));
        players.add(new PlayerCandidate("P5", 4));
        players.add(new PlayerCandidate("P6", 4));
        players.add(new PlayerCandidate("P7", 4));
        players.add(new PlayerCandidate("P8", 3));
        players.add(new PlayerCandidate("P9", 3));
        players.add(new PlayerCandidate("P10", 3));
        players.add(new PlayerCandidate("P11", 2));
        players.add(new PlayerCandidate("P12", 2));
        players.add(new PlayerCandidate("P13", 2));
        players.add(new PlayerCandidate("P14", 1));
        players.add(new PlayerCandidate("P15", 1));

        TeamSplitter greedySplitter = new TeamSplitter();
        RandomTeamSplitter randomSplitter = new RandomTeamSplitter();
        BalanceCalculator calculator = new BalanceCalculator();

        List<List<PlayerCandidate>> greedyTeams =
                greedySplitter.split(new ArrayList<>(players));

        double greedyScore =
                calculator.calculateBalanceScore(greedyTeams);

        double randomScoreSum = 0.0;
        int runs = 1000;

        for (int i = 0; i < runs; i++) {
            List<List<PlayerCandidate>> randomTeams =
                    randomSplitter.split(players);

            randomScoreSum +=
                    calculator.calculateBalanceScore(randomTeams);
        }

        double randomAverageScore = randomScoreSum / runs;

        System.out.println("Greedy score: " + greedyScore);
        System.out.println("Random average score: " + randomAverageScore);

        assertTrue(greedyScore < randomAverageScore);
    }
}