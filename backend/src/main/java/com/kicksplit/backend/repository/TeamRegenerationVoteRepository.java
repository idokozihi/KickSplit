package com.kicksplit.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kicksplit.backend.entity.TeamRegenerationVote;

public interface TeamRegenerationVoteRepository
        extends JpaRepository<TeamRegenerationVote, Long> {

    Optional<TeamRegenerationVote>
            findByUser_IdAndGame_Id(Long userId, Long gameId);

    long countByGame_Id(Long gameId);

    void deleteByGame_Id(Long gameId);
}