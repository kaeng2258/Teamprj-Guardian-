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

    /** 검색: 동기 호출을 캐싱 후 Mono로 감쌈 */
    public Mono<List<DrugSummary>> search(String query, int page, int size) {
        return Mono.fromCallable(() -> searchSync(query, page, size))
                .subscribeOn(Schedulers.boundedElastic());
    }

    @Cacheable(cacheNames = "drugSearch", key = "#query + ':' + #page + ':' + #size")
    public List<DrugSummary> searchSync(String query, int page, int size) {
        return repository.search(query, page, size);
    }

    /** 상세(품목코드): Optional -> Mono 변환 + 캐시 */
    @Cacheable(cacheNames = "drugDetail", key = "#itemSeq")
    public Mono<DrugDetail> findDetail(String itemSeq) {
        return Mono.fromCallable(() -> repository.findDetailByItemSeq(itemSeq))
                .flatMap(this::toMono)
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** 상세(품목코드 + 이름): 이름 우선/품번 백업 로직까지 리포지토리 구현에 위임 */
    public Mono<DrugDetail> findDetail(String itemSeq, String itemName) {
        return Mono.fromCallable(() -> repository.findDetail(itemSeq, itemName))
                .flatMap(this::toMono)
                .subscribeOn(Schedulers.boundedElastic());
    }

    private <T> Mono<T> toMono(Optional<T> opt) {
        return opt.map(Mono::just).orElseGet(Mono::empty);
    }
}
