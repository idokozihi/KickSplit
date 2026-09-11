package com.kicksplit.backend.dto;

import com.kicksplit.backend.entity.Group;

public class GroupResponseDto {

    private Long id;
    private String name;
    private String imageUrl;

    public GroupResponseDto(Long id, String name, String imageUrl) {
        this.id = id;
        this.name = name;
        this.imageUrl = imageUrl;
    }

    public static GroupResponseDto fromGroup(Group group) {
        return new GroupResponseDto(
                group.getId(),
                group.getName(),
                group.getImageUrl()
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
}