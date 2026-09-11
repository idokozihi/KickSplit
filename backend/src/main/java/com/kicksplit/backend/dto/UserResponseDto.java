package com.kicksplit.backend.dto;

import com.kicksplit.backend.entity.User;

public class UserResponseDto {

    private Long id;
    private String name;
    private String username;
    private String imageUrl;
    private String email;

    public UserResponseDto(
            Long id,
            String name,
            String username,
            String imageUrl,
            String email) {
        this.id = id;
        this.name = name;
        this.username = username;
        this.imageUrl = imageUrl;
        this.email = email;
    }

    public static UserResponseDto fromUser(User user) {
        return new UserResponseDto(
                user.getId(),
                user.getName(),
                user.getUsername(),
                user.getImageUrl(),
                user.getEmail());
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getUsername() {
        return username;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public String getEmail() {
        return email;
    }
}