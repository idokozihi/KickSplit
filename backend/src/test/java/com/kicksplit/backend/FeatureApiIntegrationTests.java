package com.kicksplit.backend;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.kicksplit.backend.entity.Game;
import com.kicksplit.backend.entity.Group;
import com.kicksplit.backend.entity.GroupMember;
import com.kicksplit.backend.entity.User;
import com.kicksplit.backend.repository.GameRepository;
import com.kicksplit.backend.repository.GroupMemberRepository;
import com.kicksplit.backend.repository.GroupRepository;
import com.kicksplit.backend.repository.UserRepository;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class FeatureApiIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private GroupMemberRepository groupMemberRepository;

    @Autowired
    private GameRepository gameRepository;

    private User admin;
    private User member;
    private User outsider;
    private Group group;

    @BeforeEach
    void setUp() {
        admin = userRepository.save(new User("Admin", "admin", null, "admin@example.com", "hash"));
        member = userRepository.save(new User("Member", "member", null, "member@example.com", "hash"));
        outsider = userRepository.save(new User("Outsider", "outsider", null, "outsider@example.com", "hash"));
        group = groupRepository.save(new Group("Friday FC", null));
        groupMemberRepository.save(new GroupMember(admin, group, true, 4, 4, 3));
        groupMemberRepository.save(new GroupMember(member, group, false, 3, 3, 2));
    }

    @Test
    void gameCreationUsesCurrentMemberAndReturnsTheGameResponseContract() throws Exception {
        mockMvc.perform(post("/api/games")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "groupId": %d,
                                  "userId": %d,
                                  "name": "Friday football",
                                  "date": "2026-10-02",
                                  "time": null,
                                  "targetPlayers": 15
                                }
                                """.formatted(group.getId(), member.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.groupId").value(group.getId()))
                .andExpect(jsonPath("$.groupName").value("Friday FC"))
                .andExpect(jsonPath("$.createdByUserId").value(member.getId()))
                .andExpect(jsonPath("$.name").value("Friday football"))
                .andExpect(jsonPath("$.date").value("2026-10-02"))
                .andExpect(jsonPath("$.time").value((Object) null))
                .andExpect(jsonPath("$.targetPlayers").value(15));

        Game saved = gameRepository.findByGroup_Id(group.getId()).getFirst();
        org.junit.jupiter.api.Assertions.assertEquals(member.getId(), saved.getCreatedBy().getId());

        mockMvc.perform(post("/api/games")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"groupId": %d, "userId": %d, "name": "No access", "date": "2026-10-03", "time": null, "targetPlayers": 12}
                                """.formatted(group.getId(), outsider.getId())))
                .andExpect(status().isForbidden());
    }

    @Test
    void creatorAndAdminCanDeleteIncludingLegacyGamesWithoutACreator() throws Exception {
        Game created = gameRepository.save(new Game(group, member, "Created game", LocalDate.of(2026, 10, 2), null, 15));

        mockMvc.perform(delete("/api/games/{id}", created.getId())
                        .param("userId", member.getId().toString()))
                .andExpect(status().isOk());
        org.junit.jupiter.api.Assertions.assertFalse(gameRepository.existsById(created.getId()));

        Game legacy = gameRepository.save(new Game(group, null, "Legacy game", LocalDate.of(2026, 10, 3), null, 12));
        mockMvc.perform(delete("/api/games/{id}", legacy.getId())
                        .param("userId", admin.getId().toString()))
                .andExpect(status().isOk());
        org.junit.jupiter.api.Assertions.assertFalse(gameRepository.existsById(legacy.getId()));
    }

    @Test
    void memberListAndSelfRatingUseTheFrontendContract() throws Exception {
        mockMvc.perform(get("/api/groups/{id}/members", group.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].userId").value(containsInAnyOrder(
                        admin.getId().intValue(),
                        member.getId().intValue())))
                .andExpect(jsonPath("$[?(@.userId == %d)].admin", member.getId()).value(contains(false)))
                .andExpect(jsonPath("$[?(@.userId == %d)].selfOverallRating", member.getId()).value(contains(3)));

        mockMvc.perform(patch("/api/groups/{id}/self-rating", group.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "userId": %d,
                                  "selfOverallRating": 5,
                                  "selfAttackRating": 4,
                                  "selfDefenseRating": 2
                                }
                                """.formatted(member.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(member.getId()))
                .andExpect(jsonPath("$.selfOverallRating").value(5))
                .andExpect(jsonPath("$.selfAttackRating").value(4))
                .andExpect(jsonPath("$.selfDefenseRating").value(2));

        GroupMember saved = groupMemberRepository
                .findByUser_IdAndGroup_Id(member.getId(), group.getId())
                .orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(5, saved.getSelfOverallRating());
    }

    @Test
    void leaveAndAdminRemoveUseTheirDocumentedIds() throws Exception {
        mockMvc.perform(delete("/api/groups/{groupId}/leave", group.getId())
                        .param("userId", member.getId().toString()))
                .andExpect(status().isOk());
        org.junit.jupiter.api.Assertions.assertFalse(
                groupMemberRepository.existsByUser_IdAndGroup_Id(member.getId(), group.getId()));

        User removable = userRepository.save(new User("Removable", "removable", null, "remove@example.com", "hash"));
        groupMemberRepository.save(new GroupMember(removable, group, false, 2, 2, 2));

        mockMvc.perform(delete("/api/groups/{groupId}/members/{targetUserId}", group.getId(), removable.getId())
                        .param("adminUserId", admin.getId().toString()))
                .andExpect(status().isOk());
        org.junit.jupiter.api.Assertions.assertFalse(
                groupMemberRepository.existsByUser_IdAndGroup_Id(removable.getId(), group.getId()));
    }
}
