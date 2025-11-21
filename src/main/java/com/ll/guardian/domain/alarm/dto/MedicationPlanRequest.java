package com.ll.guardian.domain.alarm.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalTime;
import java.util.List;

public record MedicationPlanRequest(
        Long medicineId,
        @Valid ManualMedicineRequest manualMedicine,
        @NotNull(message = "복용량을 입력해주세요.")
                @Min(value = 1, message = "복용량은 1 이상이어야 합니다.")
                Integer dosageAmount,
        @NotBlank(message = "복용 단위를 입력해주세요.") String dosageUnit,
        @NotNull(message = "알람 시간을 입력해주세요.") LocalTime alarmTime,
        @NotNull(message = "복용 요일을 입력해주세요.") List<String> daysOfWeek) {

    @AssertTrue(message = "약품을 검색하거나 직접 입력해주세요.")
    public boolean isMedicineSelectionValid() {
        boolean hasId = medicineId != null;
        boolean hasManual = manualMedicine != null;
        return hasId ^ hasManual;
    }
}
