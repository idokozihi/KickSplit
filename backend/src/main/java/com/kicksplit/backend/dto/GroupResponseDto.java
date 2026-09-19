package com.kicksplit.backend.dto;

import com.kicksplit.backend.entity.Group;
import com.kicksplit.backend.entity.RatingSource;
import com.kicksplit.backend.entity.ResultEntryPermission;
import com.kicksplit.backend.entity.TeamColor;
import com.kicksplit.backend.entity.TeamGenerationPermission;
import com.kicksplit.backend.entity.TeamRegenerationMode;

public class GroupResponseDto {

    private Long id;
    private String name;
    private String imageUrl;
    private RatingSource ratingSource;
    private TeamColor team1Color;
    private TeamColor team2Color;
    private TeamColor team3Color;
    private TeamGenerationPermission teamGenerationPermission;
    private TeamRegenerationMode teamRegenerationMode;
    private ResultEntryPermission resultEntryPermission;

    public GroupResponseDto(
            Long id,
            String name,
            String imageUrl,
            RatingSource ratingSource,
            TeamColor team1Color,
            TeamColor team2Color,
            TeamColor team3Color,
            TeamGenerationPermission teamGenerationPermission,
            TeamRegenerationMode teamRegenerationMode,
            ResultEntryPermission resultEntryPermission) {

        this.id = id;
        this.name = name;
        this.imageUrl = imageUrl;
        this.ratingSource = ratingSource;
        this.team1Color = team1Color;
        this.team2Color = team2Color;
        this.team3Color = team3Color;
        this.teamGenerationPermission = teamGenerationPermission;
        this.teamRegenerationMode = teamRegenerationMode;
        this.resultEntryPermission = resultEntryPermission;
    }

    public static GroupResponseDto fromGroup(Group group) {
        return new GroupResponseDto(
                group.getId(),
                group.getName(),
                group.getImageUrl(),
                group.getRatingSource(),
                group.getTeam1Color(),
                group.getTeam2Color(),
                group.getTeam3Color(),
                group.getTeamGenerationPermission(),
                group.getTeamRegenerationMode(),
                group.getResultEntryPermission()
        );
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public RatingSource getRatingSource() {
        return ratingSource;
    }

    public TeamColor getTeam1Color() {
        return team1Color;
    }

    public TeamColor getTeam2Color() {
        return team2Color;
    }

    public TeamColor getTeam3Color() {
        return team3Color;
    }

    public TeamGenerationPermission getTeamGenerationPermission() {
        return teamGenerationPermission;
    }

    public TeamRegenerationMode getTeamRegenerationMode() {
        return teamRegenerationMode;
    }

    public ResultEntryPermission getResultEntryPermission() {
        return resultEntryPermission;
    }
}