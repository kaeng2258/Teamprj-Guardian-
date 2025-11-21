package com.ll.guardian.domain.manager.dto;

public record ManagerClientSearchResponse(
        Long clientId,
        String name,
        String email,
        String status,
        String address,
        Integer age,
        String medicationCycle,
        boolean currentlyAssigned,
        Long assignedManagerId,
        String assignedManagerName,
        String assignedManagerEmail,
        boolean assignable) {}
