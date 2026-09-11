package com.kicksplit.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kicksplit.backend.entity.Guest;

public interface GuestRepository extends JpaRepository<Guest, Long> {

    List<Guest> findByGame_Id(Long gameId);
}
