package com.kicksplit.backend.dto;

import com.kicksplit.backend.entity.RegistrationStatus;

public class RegistrationRequest {

    private Long userId;
    private RegistrationStatus status;

    public RegistrationRequest() {
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public RegistrationStatus getStatus() {
        return status;
    }

    public void setStatus(RegistrationStatus status) {
        this.status = status;
    }
}