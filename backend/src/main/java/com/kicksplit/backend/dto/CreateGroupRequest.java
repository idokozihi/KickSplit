package com.kicksplit.backend.dto;

public class CreateGroupRequest {

    private String name;
    private String imageUrl;

    private Long creatorUserId;

    private int selfOverallRating;
    private int selfAttackRating;
    private int selfDefenseRating;

    public CreateGroupRequest() {
    }

    public String getName() {
        return name;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public Long getCreatorUserId() {
        return creatorUserId;
    }

    public int getSelfOverallRating() {
        return selfOverallRating;
    }

    public int getSelfAttackRating() {
        return selfAttackRating;
    }

    public int getSelfDefenseRating() {
        return selfDefenseRating;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public void setCreatorUserId(Long creatorUserId) {
        this.creatorUserId = creatorUserId;
    }

    public void setSelfOverallRating(int selfOverallRating) {
        this.selfOverallRating = selfOverallRating;
    }

    public void setSelfAttackRating(int selfAttackRating) {
        this.selfAttackRating = selfAttackRating;
    }

    public void setSelfDefenseRating(int selfDefenseRating) {
        this.selfDefenseRating = selfDefenseRating;
    }
}