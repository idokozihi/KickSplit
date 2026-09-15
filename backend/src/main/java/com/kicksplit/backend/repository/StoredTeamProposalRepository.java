package com.kicksplit.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kicksplit.backend.entity.StoredTeamProposal;

public interface StoredTeamProposalRepository extends JpaRepository<StoredTeamProposal, Long> {
    List<StoredTeamProposal> findByGame_IdOrderByProposalNumber(Long gameId);
}