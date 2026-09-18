package com.kicksplit.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kicksplit.backend.entity.Group;
import com.kicksplit.backend.entity.GroupMessage;
import com.kicksplit.backend.entity.User;
import com.kicksplit.backend.repository.GroupMemberRepository;
import com.kicksplit.backend.repository.GroupMessageRepository;
import com.kicksplit.backend.repository.GroupRepository;
import com.kicksplit.backend.repository.UserRepository;

@Service
public class GroupMessageService {

    private final GroupMessageRepository groupMessageRepository;
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final GroupMemberRepository groupMemberRepository;

    public GroupMessageService(
            GroupMessageRepository groupMessageRepository,
            GroupRepository groupRepository,
            UserRepository userRepository,
            GroupMemberRepository groupMemberRepository) {

        this.groupMessageRepository = groupMessageRepository;
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.groupMemberRepository = groupMemberRepository;
    }

    public List<GroupMessage> getMessages(
            Long groupId,
            Long userId) {

        checkMembership(groupId, userId);

        return groupMessageRepository
                .findByGroup_IdOrderByCreatedAtAsc(groupId);
    }

    @Transactional
    public GroupMessage sendMessage(
            Long groupId,
            Long userId,
            String content) {

        if (content == null || content.trim().isEmpty()) {
            throw new RuntimeException("Message cannot be empty");
        }

        checkMembership(groupId, userId);

        Group group = groupRepository.findById(groupId)
                .orElseThrow(() ->
                        new RuntimeException("Group not found"));

        User sender = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        GroupMessage message = new GroupMessage(
                group,
                sender,
                content.trim());

        return groupMessageRepository.save(message);
    }

    private void checkMembership(
            Long groupId,
            Long userId) {

        if (!groupRepository.existsById(groupId)) {
            throw new RuntimeException("Group not found");
        }

        if (!groupMemberRepository
                .existsByUser_IdAndGroup_Id(userId, groupId)) {

            throw new RuntimeException(
                    "User is not a member of this group");
        }
    }
}