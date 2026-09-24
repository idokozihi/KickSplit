package com.kicksplit.backend.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import com.kicksplit.backend.entity.Game;

public class GameResponseDto {

    private Long id;
    private Long groupId;
    private String groupName;
    private Long createdByUserId;

    private String name;
    private LocalDate date;
    private LocalTime time;
    private int targetPlayers;

    public GameResponseDto(
            Long id,
            Long groupId,
            String groupName,
            Long createdByUserId,
            String name,
            LocalDate date,
            LocalTime time,
            int targetPlayers) {

        this.id = id;
        this.groupId = groupId;
        this.groupName = groupName;
        this.createdByUserId = createdByUserId;
        this.name = name;
        this.date = date;
        this.time = time;
        this.targetPlayers = targetPlayers;
    }

    public static GameResponseDto fromGame(Game game) {
        return new GameResponseDto(
                game.getId(),
                game.getGroup().getId(),
                game.getGroup().getName(),
                game.getCreatedBy() != null
                        ? game.getCreatedBy().getId()
                        : null,
                game.getName(),
                game.getDate(),
                game.getTime(),
                game.getTargetPlayers());
    }

    public Long getId() {
        return id;
    }

    public Long getGroupId() {
        return groupId;
    }

    public String getGroupName() {
        return groupName;
    }

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public String getName() {
        return name;
    }

    public LocalDate getDate() {
        return date;
    }

    public LocalTime getTime() {
        return time;
    }

    public int getTargetPlayers() {
        return targetPlayers;
    }
}