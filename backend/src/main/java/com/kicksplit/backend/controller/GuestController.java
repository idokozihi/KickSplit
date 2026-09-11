package com.kicksplit.backend.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kicksplit.backend.service.GuestService;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.kicksplit.backend.dto.CreateGuestRequest;
import com.kicksplit.backend.dto.GuestResponseDto;
import com.kicksplit.backend.entity.Guest;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequestMapping("/api/guests")
public class GuestController {

    private final GuestService guestService;

    public GuestController(GuestService guestService) {
        this.guestService = guestService;
    }

    @PostMapping("/game/{gameId}")
    public GuestResponseDto addGuest(
            @PathVariable Long gameId,
            @RequestBody CreateGuestRequest request) {

        Guest guest = guestService.addGuest(gameId, request);
        return GuestResponseDto.fromGuest(guest);
    }

    @GetMapping("/game/{gameId}")
    public List<GuestResponseDto> getGuestsByGameId(
            @PathVariable Long gameId) {

        return guestService.getGuestsByGameId(gameId)
                .stream()
                .map(GuestResponseDto::fromGuest)
                .toList();
    }
}