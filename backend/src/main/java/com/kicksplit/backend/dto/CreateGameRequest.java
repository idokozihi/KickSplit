package com.kicksplit.backend.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public class CreateGameRequest {

    private Long groupId;
    private String name;
    private LocalDate date;
    private LocalTime time;
    private int targetPlayers;

    public CreateGameRequest() {
    }

    public Long getGroupId() {
        return groupId;
    }

    public void setGroupId(Long groupId) {
        this.groupId = groupId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public LocalTime getTime() {
        return time;
    }

    public void setTime(LocalTime time) {
        this.time = time;
    }

    public int getTargetPlayers() {
        return targetPlayers;
    }

    public void setTargetPlayers(int targetPlayers) {
        this.targetPlayers = targetPlayers;
    }
}