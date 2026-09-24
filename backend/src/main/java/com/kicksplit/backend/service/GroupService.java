package com.kicksplit.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.kicksplit.backend.dto.CreateGroupRequest;
import com.kicksplit.backend.dto.GroupMemberStatsResponseDto;
import com.kicksplit.backend.dto.JoinGroupRequest;
import com.kicksplit.backend.entity.Game;
import com.kicksplit.backend.entity.Group;
import com.kicksplit.backend.entity.GroupMember;
import com.kicksplit.backend.entity.RatingSource;
import com.kicksplit.backend.entity.Registration;
import com.kicksplit.backend.entity.RegistrationStatus;
import com.kicksplit.backend.entity.ResultEntryPermission;
import com.kicksplit.backend.entity.StoredTeamProposal;
import com.kicksplit.backend.entity.TeamColor;
import com.kicksplit.backend.entity.TeamGenerationPermission;
import com.kicksplit.backend.entity.TeamRegenerationMode;
import com.kicksplit.backend.entity.User;
import com.kicksplit.backend.repository.GameRepository;
import com.kicksplit.backend.repository.GameResultRepository;
import com.kicksplit.backend.repository.GroupMemberRepository;
import com.kicksplit.backend.repository.GroupRepository;
import com.kicksplit.backend.repository.RegistrationRepository;
import com.kicksplit.backend.repository.StoredProposalPlayerRepository;
import com.kicksplit.backend.repository.StoredTeamProposalRepository;
import com.kicksplit.backend.repository.TeamRegenerationVoteRepository;
import com.kicksplit.backend.repository.UserRepository;
import com.kicksplit.backend.repository.VoteRepository;

@Service
public class GroupService {

        private final GroupRepository groupRepository;
        private final GroupMemberRepository groupMemberRepository;
        private final UserRepository userRepository;

        private final GameRepository gameRepository;
        private final GameResultRepository gameResultRepository;
        private final RegistrationRepository registrationRepository;
        private final StoredTeamProposalRepository storedTeamProposalRepository;
        private final StoredProposalPlayerRepository storedProposalPlayerRepository;
        private final VoteRepository voteRepository;
        private final TeamRegenerationVoteRepository teamRegenerationVoteRepository;

        public GroupService(
                        GroupRepository groupRepository,
                        GroupMemberRepository groupMemberRepository,
                        UserRepository userRepository,
                        GameRepository gameRepository,
                        GameResultRepository gameResultRepository,
                        RegistrationRepository registrationRepository,
                        StoredTeamProposalRepository storedTeamProposalRepository,
                        StoredProposalPlayerRepository storedProposalPlayerRepository,
                        VoteRepository voteRepository,
                        TeamRegenerationVoteRepository teamRegenerationVoteRepository) {

                this.groupRepository = groupRepository;
                this.groupMemberRepository = groupMemberRepository;
                this.userRepository = userRepository;
                this.gameRepository = gameRepository;
                this.gameResultRepository = gameResultRepository;
                this.registrationRepository = registrationRepository;
                this.storedTeamProposalRepository = storedTeamProposalRepository;
                this.storedProposalPlayerRepository = storedProposalPlayerRepository;
                this.voteRepository = voteRepository;
                this.teamRegenerationVoteRepository = teamRegenerationVoteRepository;
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
                                .orElseThrow(() -> new RuntimeException(
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
                                .orElseThrow(() -> new RuntimeException(
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
                                .orElseThrow(() -> new RuntimeException(
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
                                .orElseThrow(() -> new RuntimeException("Group not found"));

                GroupMember membership = groupMemberRepository
                                .findByUser_IdAndGroup_Id(userId, groupId)
                                .orElseThrow(() -> new ResponseStatusException(
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

        @Transactional
        public void leaveGroup(
                        Long groupId,
                        Long userId) {

                GroupMember membership = groupMemberRepository
                                .findByUser_IdAndGroup_Id(userId, groupId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "User is not a member of this group."));

                removeMembership(membership);
        }

        @Transactional
        public void removeMember(
                        Long groupId,
                        Long adminUserId,
                        Long targetUserId) {

                GroupMember adminMembership = groupMemberRepository
                                .findByUser_IdAndGroup_Id(adminUserId, groupId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.FORBIDDEN,
                                                "User is not a member of this group."));

                if (!adminMembership.isAdmin()) {
                        throw new ResponseStatusException(
                                        HttpStatus.FORBIDDEN,
                                        "Only group admins can remove members.");
                }

                if (adminUserId.equals(targetUserId)) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "Use the leave-group action to remove yourself.");
                }

                GroupMember targetMembership = groupMemberRepository
                                .findByUser_IdAndGroup_Id(targetUserId, groupId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Member not found."));

                removeMembership(targetMembership);
        }

        private void removeMembership(
                        GroupMember membership) {

                Long groupId = membership.getGroup().getId();
                Long userId = membership.getUser().getId();

                if (membership.isAdmin()
                                && groupMemberRepository
                                                .countByGroup_IdAndAdminTrue(groupId) <= 1) {

                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "The last admin cannot leave the group.");
                }

                List<Game> games = gameRepository.findByGroup_Id(groupId);

                for (Game game : games) {

                        // Historical games stay untouched.
                        if (gameResultRepository
                                        .findByGame_Id(game.getId())
                                        .isPresent()) {
                                continue;
                        }

                        Registration registration = registrationRepository
                                        .findByUser_IdAndGame_Id(
                                                        userId,
                                                        game.getId())
                                        .orElse(null);

                        if (registration == null) {
                                continue;
                        }

                        boolean affectedExistingTeams = registration.getStatus() == RegistrationStatus.AVAILABLE;

                        registrationRepository.delete(registration);

                        if (affectedExistingTeams) {
                                clearTeamProposals(game.getId());
                        }
                }

                groupMemberRepository.delete(membership);
        }

        private void clearTeamProposals(Long gameId) {

                voteRepository.deleteByGame_Id(gameId);
                voteRepository.flush();

                teamRegenerationVoteRepository.deleteByGame_Id(gameId);
                teamRegenerationVoteRepository.flush();

                List<StoredTeamProposal> proposals = storedTeamProposalRepository
                                .findByGame_IdOrderByProposalNumber(gameId);

                for (StoredTeamProposal proposal : proposals) {
                        storedProposalPlayerRepository
                                        .deleteByProposal_Id(proposal.getId());
                }

                storedProposalPlayerRepository.flush();

                storedTeamProposalRepository.deleteAll(proposals);
                storedTeamProposalRepository.flush();
        }

        @Transactional
        public GroupMemberStatsResponseDto updateSelfRating(
                        Long groupId,
                        Long userId,
                        int selfOverallRating,
                        int selfAttackRating,
                        int selfDefenseRating) {

                if (selfOverallRating < 1 || selfOverallRating > 5
                                || selfAttackRating < 1 || selfAttackRating > 5
                                || selfDefenseRating < 1 || selfDefenseRating > 5) {

                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "Ratings must be between 1 and 5.");
                }

                GroupMember membership = groupMemberRepository
                                .findByUser_IdAndGroup_Id(userId, groupId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "User is not a member of this group."));

                // Existing members from before appRatingSeed was added:
                // preserve their old self rating as the original seed.
                if (!membership.hasAppRatingSeed()) {
                        membership.setAppRatingSeed(
                                        membership.getSelfOverallRating());
                }

                membership.setSelfOverallRating(selfOverallRating);
                membership.setSelfAttackRating(selfAttackRating);
                membership.setSelfDefenseRating(selfDefenseRating);

                // If no result has influenced the App Rating yet,
                // the new self rating becomes its starting point.
                if (membership.getRatedGames() == 0) {
                        membership.setAppRatingSeed(selfOverallRating);
                        membership.setAppRating(selfOverallRating);
                }

                GroupMember saved = groupMemberRepository.save(membership);

                return GroupMemberStatsResponseDto.fromMember(saved);
        }

        @Transactional
        public Group updateGroupImage(
                        Long groupId,
                        Long userId,
                        String imageUrl) {

                Group group = groupRepository.findById(groupId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Group not found."));

                groupMemberRepository
                                .findByUser_IdAndGroup_Id(userId, groupId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.FORBIDDEN,
                                                "User is not a member of this group."));

                if (imageUrl == null || imageUrl.isBlank()) {
                        group.setImageUrl(null);
                } else {
                        group.setImageUrl(imageUrl);
                }

                return groupRepository.save(group);
        }
}