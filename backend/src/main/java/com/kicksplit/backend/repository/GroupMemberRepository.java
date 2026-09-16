package com.kicksplit.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kicksplit.backend.entity.GroupMember;
import java.util.Optional;
import java.util.List;

public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {
    boolean existsByUser_IdAndGroup_Id(Long userId, Long groupId);
    List<GroupMember> findByUser_Id(Long userId);
    Optional<GroupMember> findByUser_IdAndGroup_Id(Long userId, Long groupId);
}