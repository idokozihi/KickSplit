
package com.kicksplit.backend.algorithm;

public class PlayerCandidate {

    private String name;
    private int rating;

    public PlayerCandidate(String name, int rating) {
        this.name = name;
        this.rating = rating;
    }

    public String getName() {
        return name;
    }

    public int getRating() {
        return rating;
    }
}