package com.ll.guardian.domain.matching.dto;

import com.ll.guardian.domain.matching.entity.CareMatch;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record CareAssignmentResponse(
        Long matchId,
        Long clientId,
        Long providerId,
        LocalDate startDate,
        LocalDate endDate,
        boolean current,
        LocalDateTime matchDate) {

    public static CareAssignmentResponse from(CareMatch match) {
        return new CareAssignmentResponse(
                match.getId(),
                match.getClient().getId(),
                match.getProvider().getId(),
                match.getStartDate(),
                match.getEndDate(),
                match.isCurrent(),
                match.getMatchDate());
    }
}
