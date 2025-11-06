// src/main/java/com/ll/guardian/domain/edrug/controller/EDrugController.java
package com.ll.guardian.domain.edrug.controller;

import com.ll.guardian.domain.edrug.dto.DrugDetail;
import com.ll.guardian.domain.edrug.service.EasyDrugService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;

@Controller
@Slf4j
@RequiredArgsConstructor
@RequestMapping("/edrug")
public class EasyDrugController {

    private final EasyDrugService easyDrugService;

    @GetMapping({"", "/"})
    public String root() { return "redirect:/edrug/search"; }

    @GetMapping("/search")
    public Mono<String> search(@RequestParam(value="query", required=false) String query,
                               @RequestParam(value="page", defaultValue="1") int page,
                               @RequestParam(value="size", defaultValue="30") int size,
                               Model model) {
        int safePage = Math.max(1, page);
        int safeSize = Math.max(1, Math.min(100, size));

        model.addAttribute("query", query == null ? "" : query);
        model.addAttribute("page", safePage);
        model.addAttribute("size", safeSize);

        if (query == null || query.isBlank()) {
            return Mono.just("edrug/search");
        }

        return easyDrugService.search(query.trim(), safePage, safeSize)
                .doOnError(e -> log.warn("edrug search failed", e))
                .onErrorReturn(java.util.Collections.emptyList())
                .map(results -> {
                    model.addAttribute("query", query.trim());
                    model.addAttribute("page", safePage);
                    model.addAttribute("size", safeSize);
                    model.addAttribute("results", results);
                    model.addAttribute("hasPrev", safePage > 1);
                    model.addAttribute("hasNext", results.size() == safeSize);
                    return "edrug/search";
                });
    }

    @GetMapping("/detail/{itemSeq}")
    public Mono<String> detail(@PathVariable String itemSeq,
                               @RequestParam(value = "name", required = false) String itemName,
                               Model model) {

        return easyDrugService.findDetail(itemSeq, itemName)
                .doOnError(e -> log.warn("detail fetch failed: {}", e.toString()))
                .onErrorResume(e -> Mono.empty())
                .defaultIfEmpty(DrugDetail.builder()
                        .itemSeq(itemSeq)
                        .itemName("상세 정보를 찾을 수 없습니다.")
                        .build())
                .map(detail -> {
                    model.addAttribute("detail", detail);
                    return "edrug/detail"; // thymeleaf template
                });
    }

    // 매핑 확인용 핑 엔드포인트 (문제 추적에 도움)
    @ResponseBody
    @GetMapping("/_ping")
    public String ping() { return "edrug-ok"; }
}


