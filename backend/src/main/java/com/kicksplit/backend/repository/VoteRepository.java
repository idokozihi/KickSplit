package com.kicksplit.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kicksplit.backend.entity.Vote;

public interface VoteRepository extends JpaRepository<Vote, Long> {

    Optional<Vote> findByUser_IdAndGame_Id(Long userId, Long gameId);

    List<Vote> findByGame_Id(Long gameId);

    void deleteByGame_Id(Long gameId);
}