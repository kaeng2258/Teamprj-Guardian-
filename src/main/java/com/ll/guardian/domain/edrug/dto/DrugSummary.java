// src/main/java/com/ll/guardian/domain/edrug/dto/DrugSummary.java
package com.ll.guardian.domain.edrug.dto;

import lombok.Builder;

@Builder
public record DrugSummary(
        String itemSeq,     // 품목기준코드
        String itemName,    // 제품명
        String entpName,    // 업체명
        String etcOtcName,  // 전문/일반
        String className,   // 분류명 (예: 해열진통제)
        String chart,       // 제형 (예: 정제)
        String itemImage     // 제품 이미지
) {}
