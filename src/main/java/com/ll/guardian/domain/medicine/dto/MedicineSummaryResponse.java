package com.ll.guardian.domain.medicine.dto;

import com.ll.guardian.domain.medicine.entity.Medicine;

public record MedicineSummaryResponse(Long id, String name, String productCode) {

    public static MedicineSummaryResponse from(Medicine medicine) {
        return new MedicineSummaryResponse(medicine.getId(), medicine.getName(), medicine.getProductCode());
    }
}
