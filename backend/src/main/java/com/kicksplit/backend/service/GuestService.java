package com.kicksplit.backend.service;

import org.springframework.stereotype.Service;

import com.kicksplit.backend.repository.GameRepository;
import com.kicksplit.backend.repository.GuestRepository;
import com.kicksplit.backend.repository.UserRepository;

import java.util.List;

import com.kicksplit.backend.dto.CreateGuestRequest;
import com.kicksplit.backend.entity.Game;
import com.kicksplit.backend.entity.Guest;
import com.kicksplit.backend.entity.User;
import com.kicksplit.backend.repository.GroupMemberRepository;

@Service
public class GuestService {

    private final GuestRepository guestRepository;
    private final GameRepository gameRepository;
    private final UserRepository userRepository;
    private final GroupMemberRepository groupMemberRepository;

    public GuestService(
            GuestRepository guestRepository,
            GameRepository gameRepository,
            UserRepository userRepository,
            GroupMemberRepository groupMemberRepository) {

        this.guestRepository = guestRepository;
        this.gameRepository = gameRepository;
        this.userRepository = userRepository;
        this.groupMemberRepository = groupMemberRepository;
    }

    public Guest addGuest(Long gameId, CreateGuestRequest request) {

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));

        User addedBy = userRepository.findById(request.getAddedByUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isMember = groupMemberRepository.existsByUser_IdAndGroup_Id(
                addedBy.getId(),
                game.getGroup().getId());

        if (!isMember) {
            throw new RuntimeException("User is not a member of this group");
        }

        Guest guest = new Guest(
                request.getName(),
                request.getRating(),
                game,
                addedBy);

        return guestRepository.save(guest);
    }

    public List<Guest> getGuestsByGameId(Long gameId) {
        return guestRepository.findByGame_Id(gameId);
    }
}