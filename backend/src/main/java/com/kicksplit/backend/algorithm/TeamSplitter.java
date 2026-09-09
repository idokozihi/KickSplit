package com.kicksplit.backend.algorithm;

import java.util.ArrayList;
import java.util.List;

public class TeamSplitter {

    public List<List<PlayerCandidate>> split(List<PlayerCandidate> players) {
        players.sort((a, b) -> Integer.compare(b.getRating(), a.getRating()));
        List<List<PlayerCandidate>> teams = new ArrayList<>();

        teams.add(new ArrayList<>());
        teams.add(new ArrayList<>());
        teams.add(new ArrayList<>());

        int[] teamSums = new int[3];

        int baseSize = players.size() / 3;
        int remainder = players.size() % 3;

        int[] targetSizes = {
                baseSize + (remainder > 0 ? 1 : 0),
                baseSize + (remainder > 1 ? 1 : 0),
                baseSize
        };

        for (PlayerCandidate player : players) {
            int bestTeam = -1;

            for (int i = 0; i < 3; i++) {
                if (teams.get(i).size() < targetSizes[i]) {
                    if (bestTeam == -1 || teamSums[i] < teamSums[bestTeam]) {
                        bestTeam = i;
                    }
                }
            }

            teams.get(bestTeam).add(player);
            teamSums[bestTeam] += player.getRating();
        }

        return teams;
    }

}