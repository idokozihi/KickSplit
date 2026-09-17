package com.kicksplit.backend.dto;

import com.kicksplit.backend.entity.Group;
import com.kicksplit.backend.entity.RatingSource;

public class GroupResponseDto {

    private Long id;
    private String name;
    private String imageUrl;
    private RatingSource ratingSource;

    public GroupResponseDto(
            Long id,
            String name,
            String imageUrl,
            RatingSource ratingSource) {

        this.id = id;
        this.name = name;
        this.imageUrl = imageUrl;
        this.ratingSource = ratingSource;
    }

    public static GroupResponseDto fromGroup(Group group) {
        return new GroupResponseDto(
                group.getId(),
                group.getName(),
                group.getImageUrl(),
                group.getRatingSource()
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
}