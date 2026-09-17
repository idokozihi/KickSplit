package com.kicksplit.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "team_proposal_players")
public class StoredProposalPlayer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "proposal_id")
    private StoredTeamProposal proposal;

    private int teamNumber;
    private String name;
    private double rating;
    private Long userId;

    public StoredProposalPlayer() {
    }

    public StoredProposalPlayer(
            StoredTeamProposal proposal,
            int teamNumber,
            Long userId,
            String name,
            double rating) {

        this.proposal = proposal;
        this.teamNumber = teamNumber;
        this.userId = userId;
        this.name = name;
        this.rating = rating;
    }

    public Long getId() {
        return id;
    }

    public StoredTeamProposal getProposal() {
        return proposal;
    }

    public int getTeamNumber() {
        return teamNumber;
    }

    public String getName() {
        return name;
    }

    public double getRating() {
        return rating;
    }

    public Long getUserId() {
        return userId;
    }
}