package com.kicksplit.backend.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kicksplit.backend.service.RegistrationService;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.kicksplit.backend.dto.RegistrationRequest;
import com.kicksplit.backend.dto.RegistrationResponseDto;
import com.kicksplit.backend.entity.Registration;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequestMapping("/api/registrations")
public class RegistrationController {

    private final RegistrationService registrationService;

    public RegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @PostMapping("/game/{gameId}")
    public RegistrationResponseDto setAvailability(
            @PathVariable Long gameId,
            @RequestBody RegistrationRequest request) {

        Registration registration = registrationService.setAvailability(gameId, request);

        return RegistrationResponseDto.fromRegistration(registration);
    }

    @GetMapping("/game/{gameId}")
    public List<RegistrationResponseDto> getRegistrationsByGameId(
            @PathVariable Long gameId) {

        return registrationService.getRegistrationsByGameId(gameId)
                .stream()
                .map(RegistrationResponseDto::fromRegistration)
                .toList();
    }
}