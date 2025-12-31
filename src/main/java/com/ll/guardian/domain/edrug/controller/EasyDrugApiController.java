package com.ll.guardian.domain.edrug.controller;

import com.ll.guardian.domain.edrug.client.ExternalDrugApiException;
import com.ll.guardian.domain.edrug.dto.DrugDetail;
import com.ll.guardian.domain.edrug.dto.DrugSummary;
import com.ll.guardian.domain.edrug.service.EasyDrugService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Collections;
import java.util.List;

@RestController
@Slf4j
@RequiredArgsConstructor
@RequestMapping("/api/drugs")
@CrossOrigin(
        origins = {
                "http://localhost:3000", "https://localhost:3000",
                "http://localhost:8081", "https://localhost:8081"
        }
)
public class EasyDrugApiController {

    private final EasyDrugService easyDrugService;

    // 🔍 검색: /api/drugs/search?query=타이레놀&page=1&size=10
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
                .timeout(Duration.ofSeconds(8))
                .onErrorMap(this::mapExternalError)
                .doOnError(e -> log.warn("edrug api search failed", e))
                .map(SearchResponse::new); // { items: [...] }
    }

    // 📄 상세: /api/drugs/{itemSeq}
    @GetMapping("/{itemSeq}")
    public Mono<DrugDetail> detail(
            @PathVariable String itemSeq,
            @RequestParam(value = "name", required = false) String itemName
    ) {
        return easyDrugService.findDetail(itemSeq, itemName)
                .timeout(Duration.ofSeconds(8))
                .onErrorMap(this::mapExternalError)
                .doOnError(e -> log.warn("edrug api detail failed: {}", e.toString()))
                .switchIfEmpty(Mono.error(
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "품목 상세를 찾을 수 없습니다.")
                ));
    }

    // 목록 응답 형태: { "items": [ DrugSummary, ... ] }
    public record SearchResponse(List<DrugSummary> items) {}

    private Throwable mapExternalError(Throwable e) {
        if (e instanceof ExternalDrugApiException ex) {
            return new ResponseStatusException(ex.getStatus(), ex.getMessage(), e);
        }
        if (isTimeout(e)) {
            return new ResponseStatusException(HttpStatus.GATEWAY_TIMEOUT, "외부 약 정보 서버 응답 지연", e);
        }
        return new ResponseStatusException(HttpStatus.BAD_GATEWAY, "외부 약 정보 서버 오류", e);
    }

    private boolean isTimeout(Throwable e) {
        Throwable cur = e;
        while (cur != null) {
            if (cur instanceof java.util.concurrent.TimeoutException) return true;
            if (cur instanceof io.netty.handler.timeout.ReadTimeoutException) return true;
            cur = cur.getCause();
        }
        return false;
    }
}

