package com.ll.guardian.domain.profile.dto;

import com.ll.guardian.domain.profile.entity.ClientProfile;

public record ClientProfileResponse(
        Long profileId,
        Long clientId,
        String address,
        Integer age,
        String medicalNotes,
        String medicationCycle) {

    public static ClientProfileResponse from(ClientProfile profile) {
        return new ClientProfileResponse(
                profile.getId(),
                profile.getClient().getId(),
                profile.getAddress(),
                profile.getAge(),
                profile.getMedicalNotes(),
                profile.getMedicationCycle());
    }
}
