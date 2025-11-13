package com.ll.guardian.domain.edrug.controller;

import com.ll.guardian.domain.edrug.dto.DrugDetail;
import com.ll.guardian.domain.edrug.dto.DrugSummary;
import com.ll.guardian.domain.edrug.service.EasyDrugService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.List;

@RestController
@Slf4j
@RequiredArgsConstructor
@RequestMapping("/api/drugs")
public class EasyDrugApiController {

    private final EasyDrugService easyDrugService;

    // ✅ 검색: /api/drugs/search?query=타이레놀&page=1&size=10
    @GetMapping("/search")
    public Mono<SearchResponse> search(
            @RequestParam String query,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        String trimmed = query == null ? "" : query.trim();
        if (trimmed.isEmpty()) {
            return Mono.just(new SearchResponse(Collections.emptyList()));
        }

        int safePage = Math.max(1, page);
        int safeSize = Math.max(1, Math.min(100, size));

        return easyDrugService.search(trimmed, safePage, safeSize)
                .doOnError(e -> log.warn("edrug api search failed", e))
                .onErrorReturn(Collections.emptyList())
                .map(SearchResponse::new); // { items: [...] } 형태로 감싸기
    }

    // ✅ 상세: /api/drugs/{itemSeq}
    @GetMapping("/{itemSeq}")
    public Mono<DrugDetail> detail(
            @PathVariable String itemSeq,
            @RequestParam(value = "name", required = false) String itemName
    ) {
        return easyDrugService.findDetail(itemSeq, itemName)
                .doOnError(e -> log.warn("edrug api detail failed: {}", e.toString()))
                .switchIfEmpty(Mono.error(
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "약품 상세를 찾을 수 없습니다.")
                ));
    }

    // 프론트 api.ts 가 기대하는 구조: { items: [ DrugSummary, ... ] }
    public record SearchResponse(List<DrugSummary> items) { }
}
