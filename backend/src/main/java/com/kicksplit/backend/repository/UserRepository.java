package com.kicksplit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kicksplit.backend.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
}