package com.kicksplit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kicksplit.backend.entity.Game;
import java.util.List;

public interface GameRepository extends JpaRepository<Game, Long> {
    List<Game> findByGroup_Id(Long groupId);
}