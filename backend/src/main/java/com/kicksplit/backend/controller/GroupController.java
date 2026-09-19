package com.kicksplit.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kicksplit.backend.dto.CreateGroupRequest;
import com.kicksplit.backend.dto.GroupMemberStatsResponseDto;
import com.kicksplit.backend.dto.GroupResponseDto;
import com.kicksplit.backend.dto.InviteTokenResponse;
import com.kicksplit.backend.dto.JoinGroupRequest;
import com.kicksplit.backend.dto.UpdateGroupPermissionsRequest;
import com.kicksplit.backend.dto.UpdateRatingSourceRequest;
import com.kicksplit.backend.dto.UpdateTeamColorsRequest;
import com.kicksplit.backend.entity.Group;
import com.kicksplit.backend.service.GroupService;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupService groupService;

    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    @PostMapping
    public GroupResponseDto createGroup(
            @RequestBody CreateGroupRequest request) {

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
    public GroupResponseDto getGroupById(
            @PathVariable Long id) {

        Group group = groupService.getGroupById(id);
        return GroupResponseDto.fromGroup(group);
    }

    @GetMapping("/user/{userId}")
    public List<GroupResponseDto> getGroupsByUserId(
            @PathVariable Long userId) {

        return groupService.getGroupsByUserId(userId)
                .stream()
                .map(GroupResponseDto::fromGroup)
                .toList();
    }

    @GetMapping("/{groupId}/invite-token/{userId}")
    public InviteTokenResponse getInviteToken(
            @PathVariable Long groupId,
            @PathVariable Long userId) {

        String token = groupService.getInviteToken(
                groupId,
                userId);

        return new InviteTokenResponse(token);
    }

    @PostMapping("/join/{inviteToken}")
    public GroupResponseDto joinGroup(
            @PathVariable String inviteToken,
            @RequestBody JoinGroupRequest request) {

        Group group = groupService.joinGroup(
                inviteToken,
                request);

        return GroupResponseDto.fromGroup(group);
    }

    @GetMapping("/{groupId}/members")
    public List<GroupMemberStatsResponseDto> getGroupMembers(
            @PathVariable Long groupId) {

        return groupService.getGroupMembers(groupId);
    }

    @PatchMapping("/{groupId}/rating-source")
    public GroupResponseDto updateRatingSource(
            @PathVariable Long groupId,
            @RequestBody UpdateRatingSourceRequest request) {

        Group group = groupService.updateRatingSource(
                groupId,
                request.userId(),
                request.ratingSource());

        return GroupResponseDto.fromGroup(group);
    }

    @PatchMapping("/{groupId}/team-colors")
    public GroupResponseDto updateTeamColors(
            @PathVariable Long groupId,
            @RequestBody UpdateTeamColorsRequest request) {

        Group group = groupService.updateTeamColors(
                groupId,
                request.userId(),
                request.team1Color(),
                request.team2Color(),
                request.team3Color());

        return GroupResponseDto.fromGroup(group);
    }

    @PatchMapping("/{groupId}/permissions")
    public GroupResponseDto updatePermissions(
            @PathVariable Long groupId,
            @RequestBody UpdateGroupPermissionsRequest request) {

        Group group = groupService.updatePermissions(
                groupId,
                request.userId(),
                request.teamGenerationPermission(),
                request.teamRegenerationMode(),
                request.resultEntryPermission());

        return GroupResponseDto.fromGroup(group);
    }
}