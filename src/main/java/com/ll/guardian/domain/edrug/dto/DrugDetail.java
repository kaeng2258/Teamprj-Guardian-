// src/main/java/com/ll/guardian/domain/edrug/dto/DrugDetail.java
package com.ll.guardian.domain.edrug.dto;

import lombok.Builder;

@Builder
public record DrugDetail(
        String itemSeq,               // 품목코드
        String itemName,              // 제품명
        String entpName,              // 업체명
        String className,             // 분류
        String chart,                 // 제형
        String itemImage,              // 이미지
        String etcOtcName,            // 전문/일반
        String materialName,          // 주요성분
        String openDe,                // 공개일자
        String updateDe,              // 수정일자

        // 상세 텍스트
        String efcyQesitm,            // 효능/효과
        String useMethodQesitm,       // 복용방법
        String atpnWarnQesitm,        // 경고
        String atpnQesitm,            // 주의사항
        String intrcQesitm,           // 상호작용
        String seQesitm,              // 부작용
        String depositMethodQesitm    // 보관방법
) {}
