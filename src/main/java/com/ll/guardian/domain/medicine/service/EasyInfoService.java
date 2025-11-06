package com.ll.guardian.domain.medicine.service;

import com.ll.guardian.domain.medicine.entity.Medicine;
import com.ll.guardian.domain.medicine.repository.MedicineRepository;
import com.ll.guardian.global.exception.GuardianException;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class EasyInfoService {

    private static final Logger log = LoggerFactory.getLogger(EasyInfoService.class);

    private final MedicineRepository medicineRepository;
    private final RestTemplate restTemplate;
    private final String apiBaseUrl;
    private final String apiKey;

    public EasyInfoService(
            MedicineRepository medicineRepository,
            RestTemplate restTemplate,
            @Value("${drug-info.api-base-url:https://apis.data.go.kr/1471000/DURPrdlstInfoService}") String apiBaseUrl,
            @Value("${drug-info.api-key:}") String apiKey) {
        this.medicineRepository = medicineRepository;
        this.restTemplate = restTemplate;
        this.apiBaseUrl = apiBaseUrl;
        this.apiKey = apiKey;
    }

    public List<Medicine> searchByKeyword(String keyword) {
        try {
            if (apiKey != null && !apiKey.isBlank()) {
                String url = UriComponentsBuilder.fromHttpUrl(apiBaseUrl + "/getDurPrdlstInfoList")
                        .queryParam("serviceKey", apiKey)
                        .queryParam("type", "json")
                        .queryParam("itemName", keyword)
                        .build()
                        .toUriString();
                ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
                log.debug("e약은요 API response status: {}", response.getStatusCode());
                // 실제 응답 파싱은 향후 구현. 현재는 로컬 DB fallback 사용.
            }
        } catch (Exception e) {
            log.warn("e약은요 API 호출 실패, 로컬 DB로 대체합니다. cause={}", e.getMessage());
        }

        List<Medicine> localResults = medicineRepository.findByNameContainingIgnoreCase(keyword);
        if (localResults.isEmpty()) {
            throw new GuardianException(
                    org.springframework.http.HttpStatus.NOT_FOUND, "약학 정보를 찾을 수 없습니다.");
        }
        return localResults;
    }

    public Medicine getMedicine(Long id) {
        return medicineRepository
                .findById(id)
                .orElseThrow(() -> new GuardianException(org.springframework.http.HttpStatus.NOT_FOUND, "약품 정보를 찾을 수 없습니다."));
    }
}
