package com.kicksplit.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
@Table(name = "group_members")
public class GroupMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "group_id")
    private Group group;
    private boolean admin;

    private int selfOverallRating;

    private int selfAttackRating;

    private int selfDefenseRating;

    private Double appRating;

    private Integer ratedGames;

    private Integer totalWins;

    private Integer totalRecordedWins;

    public GroupMember() {
    }

    public GroupMember(
            User user,
            Group group,
            boolean admin,
            int selfOverallRating,
            int selfAttackRating,
            int selfDefenseRating) {

        this.user = user;
        this.group = group;
        this.admin = admin;
        this.selfOverallRating = selfOverallRating;
        this.selfAttackRating = selfAttackRating;
        this.selfDefenseRating = selfDefenseRating;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Group getGroup() {
        return group;
    }

    public void setGroup(Group group) {
        this.group = group;
    }

    public boolean isAdmin() {
        return admin;
    }

    public void setAdmin(boolean admin) {
        this.admin = admin;
    }

    public int getSelfOverallRating() {
        return selfOverallRating;
    }

    public void setSelfOverallRating(int selfOverallRating) {
        this.selfOverallRating = selfOverallRating;
    }

    public int getSelfAttackRating() {
        return selfAttackRating;
    }

    public void setSelfAttackRating(int selfAttackRating) {
        this.selfAttackRating = selfAttackRating;
    }

    public int getSelfDefenseRating() {
        return selfDefenseRating;
    }

    public void setSelfDefenseRating(int selfDefenseRating) {
        this.selfDefenseRating = selfDefenseRating;
    }

    public double getAppRating() {
        return appRating != null ? appRating : selfOverallRating;
    }

    public void setAppRating(double appRating) {
        this.appRating = appRating;
    }

    public int getRatedGames() {
        return ratedGames != null ? ratedGames : 0;
    }

    public void setRatedGames(int ratedGames) {
        this.ratedGames = ratedGames;
    }

    public int getTotalWins() {
        return totalWins != null ? totalWins : 0;
    }

    public void setTotalWins(int totalWins) {
        this.totalWins = totalWins;
    }

    public int getTotalRecordedWins() {
        return totalRecordedWins != null ? totalRecordedWins : 0;
    }

    public void setTotalRecordedWins(int totalRecordedWins) {
        this.totalRecordedWins = totalRecordedWins;
    }

    public double getWinRate() {
        if (getTotalRecordedWins() == 0) {
            return 0.0;
        }

        return (double) getTotalWins() / getTotalRecordedWins();
    }

}
