package com.kicksplit.backend.algorithm;

public class PlayerCandidate {

    private Long userId;
    private String name;
    private double rating;

    public PlayerCandidate(String name, double rating) {
        this(null, name, rating);
    }

    public PlayerCandidate(Long userId, String name, double rating) {
        this.userId = userId;
        this.name = name;
        this.rating = rating;
    }

    public Long getUserId() {
        return userId;
    }

    public String getName() {
        return name;
    }

    public double getRating() {
        return rating;
    }
}