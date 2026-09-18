package com.kicksplit.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kicksplit.backend.entity.StoredProposalPlayer;

public interface StoredProposalPlayerRepository
        extends JpaRepository<StoredProposalPlayer, Long> {

    List<StoredProposalPlayer> findByProposal_IdOrderByTeamNumber(Long proposalId);

    void deleteByProposal_Id(Long proposalId);
}