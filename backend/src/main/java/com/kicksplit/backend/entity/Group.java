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

    @Enumerated(EnumType.STRING)
    private TeamColor team1Color;

    @Enumerated(EnumType.STRING)
    private TeamColor team2Color;

    @Enumerated(EnumType.STRING)
    private TeamColor team3Color;

    public Group() {
    }

    public Group(String name, String imageUrl) {
        this.name = name;
        this.imageUrl = imageUrl;
        this.ratingSource = RatingSource.APP_RATING;

        this.team1Color = TeamColor.RED;
        this.team2Color = TeamColor.BLACK;
        this.team3Color = TeamColor.WHITE;
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

    public TeamColor getTeam1Color() {
        return team1Color != null
                ? team1Color
                : TeamColor.RED;
    }

    public void setTeam1Color(TeamColor team1Color) {
        this.team1Color = team1Color;
    }

    public TeamColor getTeam2Color() {
        return team2Color != null
                ? team2Color
                : TeamColor.BLACK;
    }

    public void setTeam2Color(TeamColor team2Color) {
        this.team2Color = team2Color;
    }

    public TeamColor getTeam3Color() {
        return team3Color != null
                ? team3Color
                : TeamColor.WHITE;
    }

    public void setTeam3Color(TeamColor team3Color) {
        this.team3Color = team3Color;
    }
}