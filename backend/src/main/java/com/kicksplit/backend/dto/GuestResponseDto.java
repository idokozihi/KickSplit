package com.kicksplit.backend.dto;

import com.kicksplit.backend.entity.Guest;

public class GuestResponseDto {

    private Long id;
    private String name;
    private int rating;
    private Long gameId;
    private Long addedByUserId;
    private String addedByUserName;

    public GuestResponseDto(
            Long id,
            String name,
            int rating,
            Long gameId,
            Long addedByUserId,
            String addedByUserName) {

        this.id = id;
        this.name = name;
        this.rating = rating;
        this.gameId = gameId;
        this.addedByUserId = addedByUserId;
        this.addedByUserName = addedByUserName;
    }

    public static GuestResponseDto fromGuest(Guest guest) {
        return new GuestResponseDto(
                guest.getId(),
                guest.getName(),
                guest.getRating(),
                guest.getGame().getId(),
                guest.getAddedBy().getId(),
                guest.getAddedBy().getName());
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public int getRating() {
        return rating;
    }

    public Long getGameId() {
        return gameId;
    }

    public Long getAddedByUserId() {
        return addedByUserId;
    }

    public String getAddedByUserName() {
        return addedByUserName;
    }
}