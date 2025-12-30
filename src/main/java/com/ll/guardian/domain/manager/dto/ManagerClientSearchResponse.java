package com.ll.guardian.domain.manager.dto;

import java.util.List;

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
        List<Long> assignedManagerIds,
        List<String> assignedManagerNames,
        List<String> assignedManagerEmails,
        boolean assignable) {}
