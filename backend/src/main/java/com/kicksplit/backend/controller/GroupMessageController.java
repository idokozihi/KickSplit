package com.kicksplit.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.kicksplit.backend.dto.GroupMessageResponseDto;
import com.kicksplit.backend.dto.SendGroupMessageRequest;
import com.kicksplit.backend.entity.GroupMessage;
import com.kicksplit.backend.service.GroupMessageService;

@RestController
@RequestMapping("/api/groups/{groupId}/messages")
public class GroupMessageController {

    private final GroupMessageService groupMessageService;

    public GroupMessageController(
            GroupMessageService groupMessageService) {

        this.groupMessageService = groupMessageService;
    }

    @GetMapping
    public List<GroupMessageResponseDto> getMessages(
            @PathVariable Long groupId,
            @RequestParam Long userId) {

        return groupMessageService
                .getMessages(groupId, userId)
                .stream()
                .map(GroupMessageResponseDto::fromMessage)
                .toList();
    }

    @PostMapping
    public GroupMessageResponseDto sendMessage(
            @PathVariable Long groupId,
            @RequestBody SendGroupMessageRequest request) {

        GroupMessage message =
                groupMessageService.sendMessage(
                        groupId,
                        request.userId(),
                        request.content());

        return GroupMessageResponseDto.fromMessage(message);
    }
}