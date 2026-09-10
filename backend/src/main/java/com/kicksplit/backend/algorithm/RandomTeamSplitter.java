package com.kicksplit.backend.algorithm;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class RandomTeamSplitter {

    public List<List<PlayerCandidate>> split(List<PlayerCandidate> players) {
        List<PlayerCandidate> shuffledPlayers = new ArrayList<>(players);
        Collections.shuffle(shuffledPlayers);

        List<List<PlayerCandidate>> teams = new ArrayList<>();

        teams.add(new ArrayList<>());
        teams.add(new ArrayList<>());
        teams.add(new ArrayList<>());

        for (int i = 0; i < shuffledPlayers.size(); i++) {
            teams.get(i % 3).add(shuffledPlayers.get(i));
        }

        return teams;
    }
}