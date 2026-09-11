package com.kicksplit.backend.dto;

import com.kicksplit.backend.entity.Registration;
import com.kicksplit.backend.entity.RegistrationStatus;

public class RegistrationResponseDto {

    private Long id;
    private Long userId;
    private String userName;
    private Long gameId;
    private RegistrationStatus status;

    public RegistrationResponseDto(
            Long id,
            Long userId,
            String userName,
            Long gameId,
            RegistrationStatus status) {

        this.id = id;
        this.userId = userId;
        this.userName = userName;
        this.gameId = gameId;
        this.status = status;
    }

    public static RegistrationResponseDto fromRegistration(Registration registration) {
        return new RegistrationResponseDto(
                registration.getId(),
                registration.getUser().getId(),
                registration.getUser().getName(),
                registration.getGame().getId(),
                registration.getStatus());
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public String getUserName() {
        return userName;
    }

    public Long getGameId() {
        return gameId;
    }

    public RegistrationStatus getStatus() {
        return status;
    }

    
}