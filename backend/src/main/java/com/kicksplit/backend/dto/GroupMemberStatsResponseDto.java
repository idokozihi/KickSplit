package com.kicksplit.backend.dto;

import com.kicksplit.backend.entity.GroupMember;

public record GroupMemberStatsResponseDto(
        Long userId,
        String name,
        boolean admin,
        int selfOverallRating,
        int selfAttackRating,
        int selfDefenseRating,
        double appRating,
        int ratedGames,
        int totalWins,
        int totalRecordedWins,
        double winRate) {

    public static GroupMemberStatsResponseDto fromMember(GroupMember member) {

        return new GroupMemberStatsResponseDto(
                member.getUser().getId(),
                member.getUser().getName(),
                member.isAdmin(),
                member.getSelfOverallRating(),
                member.getSelfAttackRating(),
                member.getSelfDefenseRating(),
                member.getAppRating(),
                member.getRatedGames(),
                member.getTotalWins(),
                member.getTotalRecordedWins(),
                member.getWinRate());
    }
}