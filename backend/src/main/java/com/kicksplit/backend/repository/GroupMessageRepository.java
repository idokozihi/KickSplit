package com.kicksplit.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kicksplit.backend.entity.GroupMessage;

public interface GroupMessageRepository
        extends JpaRepository<GroupMessage, Long> {

    List<GroupMessage> findByGroup_IdOrderByCreatedAtAsc(Long groupId);
}