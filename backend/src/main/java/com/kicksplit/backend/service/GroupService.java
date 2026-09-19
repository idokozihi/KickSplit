package com.kicksplit.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kicksplit.backend.dto.CreateGroupRequest;
import com.kicksplit.backend.dto.GroupMemberStatsResponseDto;
import com.kicksplit.backend.dto.JoinGroupRequest;
import com.kicksplit.backend.entity.Group;
import com.kicksplit.backend.entity.GroupMember;
import com.kicksplit.backend.entity.RatingSource;
import com.kicksplit.backend.entity.ResultEntryPermission;
import com.kicksplit.backend.entity.TeamColor;
import com.kicksplit.backend.entity.TeamGenerationPermission;
import com.kicksplit.backend.entity.TeamRegenerationMode;
import com.kicksplit.backend.entity.User;
import com.kicksplit.backend.repository.GroupMemberRepository;
import com.kicksplit.backend.repository.GroupRepository;
import com.kicksplit.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;

    public GroupService(
            GroupRepository groupRepository,
            GroupMemberRepository groupMemberRepository,
            UserRepository userRepository) {

        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Group createGroup(CreateGroupRequest request) {

        User creator = userRepository.findById(request.getCreatorUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Group group = new Group(
                request.getName(),
                request.getImageUrl());

        group.setInviteToken(UUID.randomUUID().toString());

        Group savedGroup = groupRepository.save(group);

        GroupMember creatorMembership = new GroupMember(
                creator,
                savedGroup,
                true,
                request.getSelfOverallRating(),
                request.getSelfAttackRating(),
                request.getSelfDefenseRating());

        groupMemberRepository.save(creatorMembership);

        return savedGroup;
    }

    public Group getGroupById(Long id) {
        return groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Group not found"));
    }

    public List<Group> getAllGroups() {
        return groupRepository.findAll();
    }

    public List<Group> getGroupsByUserId(Long userId) {
        return groupMemberRepository.findByUser_Id(userId)
                .stream()
                .map(GroupMember::getGroup)
                .toList();
    }

    @Transactional
    public Group joinGroup(
            String inviteToken,
            JoinGroupRequest request) {

        Group group = groupRepository.findByInviteToken(inviteToken)
                .orElseThrow(() -> new RuntimeException("Invalid invite link"));

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (groupMemberRepository.existsByUser_IdAndGroup_Id(
                user.getId(),
                group.getId())) {

            throw new RuntimeException(
                    "User is already a member of this group");
        }

        GroupMember membership = new GroupMember(
                user,
                group,
                false,
                request.getSelfOverallRating(),
                request.getSelfAttackRating(),
                request.getSelfDefenseRating());

        groupMemberRepository.save(membership);

        return group;
    }

    @Transactional
    public String getInviteToken(
            Long groupId,
            Long userId) {

        GroupMember membership = groupMemberRepository
                .findByUser_IdAndGroup_Id(userId, groupId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User is not a member of this group"));

        if (!membership.isAdmin()) {
            throw new RuntimeException(
                    "Only group admins can access the invite code");
        }

        Group group = membership.getGroup();

        if (group.getInviteToken() == null) {
            group.setInviteToken(UUID.randomUUID().toString());
            groupRepository.save(group);
        }

        return group.getInviteToken();
    }

    public List<GroupMemberStatsResponseDto> getGroupMembers(
            Long groupId) {

        if (!groupRepository.existsById(groupId)) {
            throw new RuntimeException("Group not found");
        }

        return groupMemberRepository
                .findByGroup_Id(groupId)
                .stream()
                .map(GroupMemberStatsResponseDto::fromMember)
                .toList();
    }

    @Transactional
    public Group updateRatingSource(
            Long groupId,
            Long userId,
            RatingSource ratingSource) {

        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        GroupMember membership = groupMemberRepository
                .findByUser_IdAndGroup_Id(userId, groupId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User is not a member of this group"));

        if (!membership.isAdmin()) {
            throw new RuntimeException(
                    "Only group admins can change rating source");
        }

        if (ratingSource == null) {
            throw new RuntimeException(
                    "Rating source is required");
        }

        group.setRatingSource(ratingSource);

        return groupRepository.save(group);
    }

    @Transactional
    public Group updateTeamColors(
            Long groupId,
            Long userId,
            TeamColor team1Color,
            TeamColor team2Color,
            TeamColor team3Color) {

        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        GroupMember membership = groupMemberRepository
                .findByUser_IdAndGroup_Id(userId, groupId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User is not a member of this group"));

        if (!membership.isAdmin()) {
            throw new RuntimeException(
                    "Only group admins can change team colors");
        }

        if (team1Color == null
                || team2Color == null
                || team3Color == null) {

            throw new RuntimeException(
                    "All team colors are required");
        }

        if (team1Color == team2Color
                || team1Color == team3Color
                || team2Color == team3Color) {

            throw new RuntimeException(
                    "Team colors must be different");
        }

        group.setTeam1Color(team1Color);
        group.setTeam2Color(team2Color);
        group.setTeam3Color(team3Color);

        return groupRepository.save(group);
    }
@Transactional
public Group updatePermissions(
        Long groupId,
        Long userId,
        TeamGenerationPermission teamGenerationPermission,
        TeamRegenerationMode teamRegenerationMode,
        ResultEntryPermission resultEntryPermission) {

    Group group = groupRepository.findById(groupId)
            .orElseThrow(() ->
                    new RuntimeException("Group not found"));

    GroupMember membership = groupMemberRepository
            .findByUser_IdAndGroup_Id(userId, groupId)
            .orElseThrow(() ->
                    new ResponseStatusException(
                            HttpStatus.FORBIDDEN,
                            "User is not a member of this group."));

    if (!membership.isAdmin()) {
        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Only group admins can change permissions.");
    }

    if (teamGenerationPermission == null
            || teamRegenerationMode == null
            || resultEntryPermission == null) {

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "All group permissions are required.");
    }

    group.setTeamGenerationPermission(
            teamGenerationPermission);

    group.setTeamRegenerationMode(
            teamRegenerationMode);

    group.setResultEntryPermission(
            resultEntryPermission);

    return groupRepository.save(group);
}
}