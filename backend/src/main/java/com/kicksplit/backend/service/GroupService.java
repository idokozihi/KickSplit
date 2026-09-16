package com.kicksplit.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kicksplit.backend.dto.CreateGroupRequest;
import com.kicksplit.backend.dto.JoinGroupRequest;
import com.kicksplit.backend.entity.Group;
import com.kicksplit.backend.entity.GroupMember;
import com.kicksplit.backend.entity.User;
import com.kicksplit.backend.repository.GroupMemberRepository;
import com.kicksplit.backend.repository.GroupRepository;
import com.kicksplit.backend.repository.UserRepository;

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
    public Group joinGroup(String inviteToken, JoinGroupRequest request) {

        Group group = groupRepository.findByInviteToken(inviteToken)
                .orElseThrow(() -> new RuntimeException("Invalid invite link"));

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (groupMemberRepository.existsByUser_IdAndGroup_Id(user.getId(), group.getId())) {
            throw new RuntimeException("User is already a member of this group");
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

}