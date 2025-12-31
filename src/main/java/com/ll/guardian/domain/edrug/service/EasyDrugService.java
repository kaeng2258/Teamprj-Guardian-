// src/main/java/com/ll/guardian/domain/edrug/service/EasyDrugService.java
package com.ll.guardian.domain.edrug.service;

import com.ll.guardian.domain.edrug.dto.DrugDetail;
import com.ll.guardian.domain.edrug.dto.DrugSummary;
import com.ll.guardian.domain.edrug.repository.DrugInfoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EasyDrugService {
    private final DrugInfoRepository repository;

    /** 검색: 블로킹 리포지토리 호출을 리액터 스레드풀로 오프로드 */
    public Mono<List<DrugSummary>> search(String query, int page, int size) {
        return Mono.fromCallable(() -> repository.search(query, page, size))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** 상세(품목코드): Optional -> Mono로 래핑 */
    @Cacheable(cacheNames = "drugDetail", key = "#itemSeq")
    public Mono<DrugDetail> findDetail(String itemSeq) {
        return Mono.fromCallable(() -> repository.findDetailByItemSeq(itemSeq))
                .flatMap(this::toMono)
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** 상세(품목코드 + 이름): 이름 우선/폴백 로직은 리포지토리 구현에 있음 */
    public Mono<DrugDetail> findDetail(String itemSeq, String itemName) {
        return Mono.fromCallable(() -> repository.findDetail(itemSeq, itemName))
                .flatMap(this::toMono)
                .subscribeOn(Schedulers.boundedElastic());
    }

    private <T> Mono<T> toMono(Optional<T> opt) {
        return opt.map(Mono::just).orElseGet(Mono::empty);
    }
}
