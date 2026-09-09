package com.kicksplit.backend.algorithm;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

public class BalanceCalculatorTest {

    @Test
    void shouldCalculateBalanceScore() {
        List<List<PlayerCandidate>> teams = new ArrayList<>();

        teams.add(List.of(
                new PlayerCandidate("A", 5),
                new PlayerCandidate("B", 3)
        ));

        teams.add(List.of(
                new PlayerCandidate("C", 4),
                new PlayerCandidate("D", 3)
        ));

        teams.add(List.of(
                new PlayerCandidate("E", 3),
                new PlayerCandidate("F", 3)
        ));

        BalanceCalculator calculator = new BalanceCalculator();

        double score = calculator.calculateBalanceScore(teams);

        assertEquals(1.0, score);
    }
}