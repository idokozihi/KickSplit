package com.kicksplit.backend.algorithm;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class TeamSplitter {

    private final Random random = new Random();

    public List<List<PlayerCandidate>> split(List<PlayerCandidate> players) {

        if (players.size() < 3) {
            throw new IllegalArgumentException("At least 3 players are required");
        }

        players.sort(
                (a, b) -> Double.compare(b.getRating(), a.getRating())
        );

        List<List<PlayerCandidate>> teams = new ArrayList<>();

        teams.add(new ArrayList<>());
        teams.add(new ArrayList<>());
        teams.add(new ArrayList<>());

        double[] teamSums = new double[3];

        int baseSize = players.size() / 3;
        int remainder = players.size() % 3;

        int[] targetSizes = {
                baseSize + (remainder > 0 ? 1 : 0),
                baseSize + (remainder > 1 ? 1 : 0),
                baseSize
        };

        for (PlayerCandidate player : players) {

            double minSum = Double.POSITIVE_INFINITY;
            List<Integer> bestTeams = new ArrayList<>();

            for (int i = 0; i < 3; i++) {

                if (teams.get(i).size() < targetSizes[i]) {

                    if (teamSums[i] < minSum) {

                        minSum = teamSums[i];
                        bestTeams.clear();
                        bestTeams.add(i);

                    } else if (Double.compare(teamSums[i], minSum) == 0) {

                        bestTeams.add(i);
                    }
                }
            }

            int bestTeam =
                    bestTeams.get(random.nextInt(bestTeams.size()));

            teams.get(bestTeam).add(player);
            teamSums[bestTeam] += player.getRating();
        }

        return teams;
    }
}