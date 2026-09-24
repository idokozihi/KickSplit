package com.kicksplit.backend.entity;

import jakarta.persistence.Column;
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

    @Column(columnDefinition = "TEXT")
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

    @Enumerated(EnumType.STRING)
    private TeamGenerationPermission teamGenerationPermission;

    @Enumerated(EnumType.STRING)
    private TeamRegenerationMode teamRegenerationMode;

    @Enumerated(EnumType.STRING)
    private ResultEntryPermission resultEntryPermission;

    public Group() {
    }

    public Group(String name, String imageUrl) {
        this.name = name;
        this.imageUrl = imageUrl;

        this.ratingSource = RatingSource.APP_RATING;

        this.team1Color = TeamColor.RED;
        this.team2Color = TeamColor.BLACK;
        this.team3Color = TeamColor.WHITE;

        this.teamGenerationPermission =
                TeamGenerationPermission.PLAYERS;

        this.teamRegenerationMode =
                TeamRegenerationMode.PLAYER_VOTE;

        this.resultEntryPermission =
                ResultEntryPermission.PLAYERS;
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

    public TeamGenerationPermission getTeamGenerationPermission() {
        return teamGenerationPermission != null
                ? teamGenerationPermission
                : TeamGenerationPermission.PLAYERS;
    }

    public void setTeamGenerationPermission(
            TeamGenerationPermission teamGenerationPermission) {

        this.teamGenerationPermission =
                teamGenerationPermission;
    }

    public TeamRegenerationMode getTeamRegenerationMode() {
        return teamRegenerationMode != null
                ? teamRegenerationMode
                : TeamRegenerationMode.PLAYER_VOTE;
    }

    public void setTeamRegenerationMode(
            TeamRegenerationMode teamRegenerationMode) {

        this.teamRegenerationMode =
                teamRegenerationMode;
    }

    public ResultEntryPermission getResultEntryPermission() {
        return resultEntryPermission != null
                ? resultEntryPermission
                : ResultEntryPermission.PLAYERS;
    }

    public void setResultEntryPermission(
            ResultEntryPermission resultEntryPermission) {

        this.resultEntryPermission =
                resultEntryPermission;
    }
}