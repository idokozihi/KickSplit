package com.kicksplit.backend.algorithm;

import java.util.List;

public class BalanceCalculator {

    public double calculateBalanceScore(List<List<PlayerCandidate>> teams) {
        double minAverage = Double.POSITIVE_INFINITY;
        double maxAverage = Double.NEGATIVE_INFINITY;

        for (List<PlayerCandidate> team : teams) {
            double average = calculateTeamAverage(team);

            minAverage = Math.min(minAverage, average);
            maxAverage = Math.max(maxAverage, average);
        }

        return maxAverage - minAverage;
    }

    private double calculateTeamAverage(List<PlayerCandidate> team) {
        double sum = 0.0;

        for (PlayerCandidate player : team) {
            sum += player.getRating();
        }

        return sum / team.size();
    }
}