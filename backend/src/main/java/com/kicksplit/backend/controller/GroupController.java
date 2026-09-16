package com.kicksplit.backend.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kicksplit.backend.service.GroupService;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.kicksplit.backend.dto.CreateGroupRequest;
import com.kicksplit.backend.entity.Group;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;

import org.springframework.web.bind.annotation.PathVariable;

import com.kicksplit.backend.dto.GroupResponseDto;
import com.kicksplit.backend.dto.JoinGroupRequest;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupService groupService;

    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    @PostMapping
    public GroupResponseDto createGroup(@RequestBody CreateGroupRequest request) {
        Group group = groupService.createGroup(request);
        return GroupResponseDto.fromGroup(group);
    }

    @GetMapping
    public List<GroupResponseDto> getAllGroups() {
        return groupService.getAllGroups()
                .stream()
                .map(GroupResponseDto::fromGroup)
                .toList();
    }

    @GetMapping("/{id}")
    public GroupResponseDto getGroupById(@PathVariable Long id) {
        Group group = groupService.getGroupById(id);
        return GroupResponseDto.fromGroup(group);
    }

    @GetMapping("/user/{userId}")
    public List<GroupResponseDto> getGroupsByUserId(@PathVariable Long userId) {
        return groupService.getGroupsByUserId(userId)
                .stream()
                .map(GroupResponseDto::fromGroup)
                .toList();
    }

    @PostMapping("/join/{inviteToken}")
    public GroupResponseDto joinGroup(
            @PathVariable String inviteToken,
            @RequestBody JoinGroupRequest request) {

        Group group = groupService.joinGroup(inviteToken, request);
        return GroupResponseDto.fromGroup(group);
    }
}