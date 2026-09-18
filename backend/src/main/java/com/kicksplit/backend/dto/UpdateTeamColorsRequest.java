package com.kicksplit.backend.dto;

import com.kicksplit.backend.entity.TeamColor;

public record UpdateTeamColorsRequest(
        Long userId,
        TeamColor team1Color,
        TeamColor team2Color,
        TeamColor team3Color) {
}