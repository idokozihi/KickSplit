package com.kicksplit.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "game_results")
public class GameResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "game_id", unique = true)
    private Game game;

    @ManyToOne
    @JoinColumn(name = "proposal_id")
    private StoredTeamProposal proposal;

    @ManyToOne
    @JoinColumn(name = "entered_by_user_id")
    private User enteredBy;

    private int team1Wins;
    private int team2Wins;
    private int team3Wins;

    public GameResult() {
    }

    public GameResult(
            Game game,
            StoredTeamProposal proposal,
            User enteredBy,
            int team1Wins,
            int team2Wins,
            int team3Wins) {

        this.game = game;
        this.proposal = proposal;
        this.enteredBy = enteredBy;
        this.team1Wins = team1Wins;
        this.team2Wins = team2Wins;
        this.team3Wins = team3Wins;
    }

    public Long getId() {
        return id;
    }

    public Game getGame() {
        return game;
    }

    public StoredTeamProposal getProposal() {
        return proposal;
    }

    public int getTeam1Wins() {
        return team1Wins;
    }

    public int getTeam2Wins() {
        return team2Wins;
    }

    public int getTeam3Wins() {
        return team3Wins;
    }

    public void setProposal(StoredTeamProposal proposal) {
        this.proposal = proposal;
    }

    public void setTeam1Wins(int team1Wins) {
        this.team1Wins = team1Wins;
    }

    public void setTeam2Wins(int team2Wins) {
        this.team2Wins = team2Wins;
    }

    public void setTeam3Wins(int team3Wins) {
        this.team3Wins = team3Wins;
    }

    public User getEnteredBy() {
    return enteredBy;
}
}