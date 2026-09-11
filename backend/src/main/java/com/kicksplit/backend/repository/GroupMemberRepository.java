package com.kicksplit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kicksplit.backend.entity.GroupMember;
import java.util.Optional;

public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {
    boolean existsByUser_IdAndGroup_Id(Long userId, Long groupId);
    Optional<GroupMember> findByUser_IdAndGroup_Id(Long userId, Long groupId);
}