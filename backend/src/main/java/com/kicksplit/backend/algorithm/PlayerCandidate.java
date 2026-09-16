package com.kicksplit.backend.algorithm;

public class PlayerCandidate {

    private Long userId;
    private String name;
    private int rating;

    public PlayerCandidate(String name, int rating) {
        this(null, name, rating);
    }

    public PlayerCandidate(Long userId, String name, int rating) {
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

    public int getRating() {
        return rating;
    }
}