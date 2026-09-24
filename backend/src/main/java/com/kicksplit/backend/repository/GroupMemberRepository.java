package com.kicksplit.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kicksplit.backend.entity.GroupMember;

public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {

    boolean existsByUser_IdAndGroup_Id(Long userId, Long groupId);

    List<GroupMember> findByUser_Id(Long userId);

    List<GroupMember> findByGroup_Id(Long groupId);

    Optional<GroupMember> findByUser_IdAndGroup_Id(Long userId, Long groupId);

    long countByGroup_IdAndAdminTrue(Long groupId);
}