// src/main/java/com/ll/guardian/domain/edrug/repository/DrugInfoRepository.java
package com.ll.guardian.domain.edrug.repository;

import com.ll.guardian.domain.edrug.dto.DrugDetail;
import com.ll.guardian.domain.edrug.dto.DrugSummary;

import java.util.List;
import java.util.Optional;

public interface DrugInfoRepository {
    List<DrugSummary> search(String query, int page, int size);

    Optional<DrugDetail> findDetail(String itemSeq, String itemName);

    default Optional<DrugDetail> findDetailByItemSeq(String itemSeq) {
        return findDetail(itemSeq, null);
    }
}
