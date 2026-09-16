package com.kicksplit.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kicksplit.backend.entity.GameResult;

public interface GameResultRepository extends JpaRepository<GameResult, Long> {

    Optional<GameResult> findByGame_Id(Long gameId);
}