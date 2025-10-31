package com.ll.guardian.domain.provider.dto;

public record ProviderClientSearchResponse(
        Long clientId,
        String name,
        String email,
        String status,
        String address,
        Integer age,
        String medicationCycle,
        boolean currentlyAssigned,
        Long assignedProviderId,
        String assignedProviderName,
        String assignedProviderEmail,
        boolean assignable) {}
