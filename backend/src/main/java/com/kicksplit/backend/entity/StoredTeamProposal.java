package com.kicksplit.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "team_proposals")
public class StoredTeamProposal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "game_id")
    private Game game;

    private int proposalNumber;
    private double balanceScore;

    public StoredTeamProposal() {
    }

    public StoredTeamProposal(Game game, int proposalNumber, double balanceScore) {
        this.game = game;
        this.proposalNumber = proposalNumber;
        this.balanceScore = balanceScore;
    }

    public Long getId() {
        return id;
    }

    public Game getGame() {
        return game;
    }

    public int getProposalNumber() {
        return proposalNumber;
    }

    public double getBalanceScore() {
        return balanceScore;
    }
}