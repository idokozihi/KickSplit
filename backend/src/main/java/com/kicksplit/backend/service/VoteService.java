package com.kicksplit.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kicksplit.backend.dto.VoteRequest;
import com.kicksplit.backend.dto.VoteResponseDto;
import com.kicksplit.backend.entity.Game;
import com.kicksplit.backend.entity.StoredTeamProposal;
import com.kicksplit.backend.entity.User;
import com.kicksplit.backend.entity.Vote;
import com.kicksplit.backend.repository.GameRepository;
import com.kicksplit.backend.repository.StoredTeamProposalRepository;
import com.kicksplit.backend.repository.UserRepository;
import com.kicksplit.backend.repository.VoteRepository;

@Service
public class VoteService {

    private final VoteRepository voteRepository;
    private final UserRepository userRepository;
    private final GameRepository gameRepository;
    private final StoredTeamProposalRepository proposalRepository;

    public VoteService(
            VoteRepository voteRepository,
            UserRepository userRepository,
            GameRepository gameRepository,
            StoredTeamProposalRepository proposalRepository) {

        this.voteRepository = voteRepository;
        this.userRepository = userRepository;
        this.gameRepository = gameRepository;
        this.proposalRepository = proposalRepository;
    }

    @Transactional
    public VoteResponseDto vote(Long gameId, VoteRequest request) {

        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));

        StoredTeamProposal proposal = proposalRepository.findById(request.proposalId())
                .orElseThrow(() -> new RuntimeException("Proposal not found"));

        if (!proposal.getGame().getId().equals(gameId)) {
            throw new RuntimeException("Proposal does not belong to this game");
        }

        Vote vote = voteRepository
                .findByUser_IdAndGame_Id(user.getId(), gameId)
                .orElseGet(() -> new Vote(user, game, proposal));

        vote.setProposal(proposal);

        Vote saved = voteRepository.save(vote);

        return toDto(saved);
    }

    public List<VoteResponseDto> getVotes(Long gameId) {

        return voteRepository.findByGame_Id(gameId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    private VoteResponseDto toDto(Vote vote) {
        return new VoteResponseDto(
                vote.getId(),
                vote.getUser().getId(),
                vote.getGame().getId(),
                vote.getProposal().getId());
    }
}