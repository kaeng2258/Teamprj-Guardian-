package com.ll.guardian.domain.medicine.dto;

import jakarta.validation.constraints.NotBlank;

public record EasyDrugImportRequest(
        @NotBlank(message = "품목 기준 코드를 입력해주세요.") String itemSeq,
        @NotBlank(message = "약품 이름을 입력해주세요.") String itemName) {}
