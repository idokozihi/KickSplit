package com.kicksplit.backend.dto;

public class JoinGroupRequest {

    private Long userId;

    private int selfOverallRating;
    private int selfAttackRating;
    private int selfDefenseRating;

    public JoinGroupRequest() {
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
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
}