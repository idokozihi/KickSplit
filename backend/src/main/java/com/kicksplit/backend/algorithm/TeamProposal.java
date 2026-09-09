package com.kicksplit.backend.algorithm;

import java.util.List;

public class TeamProposal {

    private List<List<PlayerCandidate>> teams;
    private double balanceScore;

    public TeamProposal(List<List<PlayerCandidate>> teams, double balanceScore) {
        this.teams = teams;
        this.balanceScore = balanceScore;
    }

    public List<List<PlayerCandidate>> getTeams() {
        return teams;
    }

    public double getBalanceScore() {
        return balanceScore;
    }
}