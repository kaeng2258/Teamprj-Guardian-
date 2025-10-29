package com.ll.guardian.domain.matching.dto;

public record AssignedProviderResponse(
        Long matchId,
        Long providerId,
        String providerName,
        String providerEmail,
        boolean current) {}
