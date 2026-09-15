package com.kicksplit.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "votes",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "game_id"})
)
public class Vote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "game_id")
    private Game game;

    @ManyToOne
    @JoinColumn(name = "proposal_id")
    private StoredTeamProposal proposal;

    public Vote() {
    }

    public Vote(User user, Game game, StoredTeamProposal proposal) {
        this.user = user;
        this.game = game;
        this.proposal = proposal;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public Game getGame() {
        return game;
    }

    public StoredTeamProposal getProposal() {
        return proposal;
    }

    public void setProposal(StoredTeamProposal proposal) {
        this.proposal = proposal;
    }
}