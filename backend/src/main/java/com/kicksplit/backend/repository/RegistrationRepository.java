package com.kicksplit.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kicksplit.backend.entity.Registration;

public interface RegistrationRepository extends JpaRepository<Registration, Long> {

    Optional<Registration> findByUser_IdAndGame_Id(Long userId, Long gameId);

    List<Registration> findByGame_Id(Long gameId);
}