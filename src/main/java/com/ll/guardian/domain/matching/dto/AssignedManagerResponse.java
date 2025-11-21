package com.ll.guardian.domain.matching.dto;

public record AssignedManagerResponse(
        Long matchId,
        Long managerId,
        String managerName,
        String managerEmail,
        boolean current) {}
