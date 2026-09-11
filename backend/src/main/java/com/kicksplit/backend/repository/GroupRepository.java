package com.kicksplit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kicksplit.backend.entity.Group;

import java.util.Optional;

public interface GroupRepository extends JpaRepository<Group, Long> {

    Optional<Group> findByInviteToken(String inviteToken);
}