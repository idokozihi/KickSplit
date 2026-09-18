package com.kicksplit.backend.dto;

import java.time.Instant;

import com.kicksplit.backend.entity.GroupMessage;

public record GroupMessageResponseDto(
        Long id,
        Long groupId,
        Long senderId,
        String senderName,
        String senderUsername,
        String senderImageUrl,
        String content,
        Instant createdAt) {

    public static GroupMessageResponseDto fromMessage(
            GroupMessage message) {

        return new GroupMessageResponseDto(
                message.getId(),
                message.getGroup().getId(),
                message.getSender().getId(),
                message.getSender().getName(),
                message.getSender().getUsername(),
                message.getSender().getImageUrl(),
                message.getContent(),
                message.getCreatedAt()
        );
    }
}