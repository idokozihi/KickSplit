package com.kicksplit.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "groups")
public class Group {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String imageUrl;
    private String inviteToken;

    @Enumerated(EnumType.STRING)
    private RatingSource ratingSource;

    public Group() {
    }

    public Group(String name, String imageUrl) {
        this.name = name;
        this.imageUrl = imageUrl;
        this.ratingSource = RatingSource.APP_RATING;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getInviteToken() {
        return inviteToken;
    }

    public void setInviteToken(String inviteToken) {
        this.inviteToken = inviteToken;
    }

    public RatingSource getRatingSource() {
        return ratingSource != null
                ? ratingSource
                : RatingSource.APP_RATING;
    }

    public void setRatingSource(RatingSource ratingSource) {
        this.ratingSource = ratingSource;
    }
}