package com.kicksplit.backend.service;

import org.springframework.stereotype.Service;

import com.kicksplit.backend.repository.GameRepository;
import com.kicksplit.backend.repository.RegistrationRepository;
import com.kicksplit.backend.repository.UserRepository;

import com.kicksplit.backend.dto.RegistrationRequest;
import com.kicksplit.backend.entity.Game;
import com.kicksplit.backend.entity.Registration;
import com.kicksplit.backend.entity.User;
import com.kicksplit.backend.repository.GroupMemberRepository;

import java.util.List;

@Service
public class RegistrationService {

    private final RegistrationRepository registrationRepository;
    private final UserRepository userRepository;
    private final GameRepository gameRepository;
    private final GroupMemberRepository groupMemberRepository;

    public RegistrationService(
            RegistrationRepository registrationRepository,
            UserRepository userRepository,
            GameRepository gameRepository,
            GroupMemberRepository groupMemberRepository) {

        this.registrationRepository = registrationRepository;
        this.userRepository = userRepository;
        this.gameRepository = gameRepository;
        this.groupMemberRepository = groupMemberRepository;
    }

    public Registration setAvailability(Long gameId, RegistrationRequest request) {

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isMember = groupMemberRepository.existsByUser_IdAndGroup_Id(
                user.getId(),
                game.getGroup().getId());

        if (!isMember) {
            throw new RuntimeException("User is not a member of this group");
        }

        Registration registration = registrationRepository
                .findByUser_IdAndGame_Id(user.getId(), game.getId())
                .orElse(new Registration(user, game, request.getStatus()));

        registration.setStatus(request.getStatus());

        return registrationRepository.save(registration);
    }

    public List<Registration> getRegistrationsByGameId(Long gameId) {
        return registrationRepository.findByGame_Id(gameId);
    }
}