package com.ll.guardian.domain.medicine.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ll.guardian.domain.medicine.entity.Medicine;
import com.ll.guardian.domain.medicine.repository.MedicineRepository;
import com.ll.guardian.global.exception.GuardianException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
@Transactional(readOnly = true)
public class DrugInfoService {

    private static final Logger log = LoggerFactory.getLogger(DrugInfoService.class);

    private final MedicineRepository medicineRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String apiBaseUrl;
    private final String apiKey;

    public DrugInfoService(
            MedicineRepository medicineRepository,
            RestTemplate restTemplate,
            ObjectMapper objectMapper,
            @Value("${mfds.easydrug.base-url:https://apis.data.go.kr/1471000/DrbEasyDrugInfoService}") String apiBaseUrl,
            @Value("${mfds.easydrug.service-key:}") String apiKey) {
        this.medicineRepository = medicineRepository;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.apiBaseUrl = apiBaseUrl;
        this.apiKey = apiKey;
    }

    @Transactional
    public List<Medicine> searchByKeyword(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return Collections.emptyList();
        }

        String normalizedKeyword = keyword.trim();
        syncWithExternalApi(normalizedKeyword);
        List<Medicine> results = medicineRepository.findByNameContainingIgnoreCase(normalizedKeyword);
        if (results.isEmpty()) {
            log.debug("No medicine match found for keyword='{}'", normalizedKeyword);
        }
        return results;
    }

    public Medicine getMedicine(Long id) {
        return medicineRepository
                .findById(id)
                .orElseThrow(() -> new GuardianException(org.springframework.http.HttpStatus.NOT_FOUND, "약품 정보를 찾을 수 없습니다."));
    }

    private void syncWithExternalApi(String keyword) {
        if (!StringUtils.hasText(apiKey)) {
            log.debug("Skipping e약은요 sync because API key is missing.");
            return;
        }

        try {
            String url = UriComponentsBuilder.fromHttpUrl(apiBaseUrl + "/getDrbEasyDrugInfoList")
                    .queryParam("serviceKey", apiKey)
                    .queryParam("type", "json")
                    .queryParam("itemName", keyword)
                    .queryParam("pageNo", 1)
                    .queryParam("numOfRows", 30)
                    .build()
                    .toUriString();

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                log.warn("e약은요 API 호출이 실패했습니다. status={}, body={}", response.getStatusCode(), response.getBody());
                return;
            }

            List<Medicine> synced = parseAndPersist(response.getBody());
            log.debug("Synced {} medicines from e약은요 for keyword='{}'", synced.size(), keyword);
        } catch (Exception e) {
            log.warn("e약은요 API 호출 실패, 로컬 DB로 대체합니다. cause={}", e.getMessage());
        }
    }

    private List<Medicine> parseAndPersist(String body) throws JsonProcessingException {
        if (!StringUtils.hasText(body)) {
            return Collections.emptyList();
        }

        JsonNode root = objectMapper.readTree(body);
        JsonNode responseNode = root.has("response") ? root.path("response") : root;
        JsonNode headerNode = responseNode.path("header");
        if (headerNode.isObject()) {
            String resultCode = headerNode.path("resultCode").asText("");
            if (!"00".equals(resultCode) && !"0000".equals(resultCode)) {
                String message = headerNode.path("resultMsg").asText("UNKNOWN");
                log.warn("e약은요 API가 실패를 반환했습니다. code={}, message={}", resultCode, message);
                return Collections.emptyList();
            }
        }

        JsonNode bodyNode = responseNode.path("body");
        JsonNode itemsNode = bodyNode.path("items");
        if (itemsNode.isMissingNode() || itemsNode.isNull()) {
            return Collections.emptyList();
        }

        List<JsonNode> nodes = new ArrayList<>();
        if (itemsNode.isArray()) {
            itemsNode.forEach(nodes::add);
        } else if (itemsNode.isObject()) {
            nodes.add(itemsNode);
        }

        List<Medicine> persisted = new ArrayList<>();
        for (JsonNode itemNode : nodes) {
            Medicine medicine = upsertMedicine(itemNode);
            if (medicine != null) {
                persisted.add(medicine);
            }
        }
        return persisted;
    }

    private Medicine upsertMedicine(JsonNode itemNode) {
        String productCode = textValue(itemNode, "itemSeq");
        String name = textValue(itemNode, "itemName");
        if (!StringUtils.hasText(productCode) || !StringUtils.hasText(name)) {
            return null;
        }

        Optional<Medicine> existing = medicineRepository.findByProductCode(productCode);
        if (existing.isPresent()) {
            return existing.get();
        }

        Medicine medicine = Medicine.builder()
                .productCode(productCode)
                .name(name)
                .efficacy(textValue(itemNode, "efcyQesitm"))
                .usageDosage(textValue(itemNode, "useMethodQesitm"))
                .caution(mergeCaution(itemNode))
                .sideEffects(textValue(itemNode, "seQesitm"))
                .description(buildDescription(itemNode))
                .build();
        return medicineRepository.save(medicine);
    }

    private String mergeCaution(JsonNode itemNode) {
        String warning = textValue(itemNode, "atpnWarnQesitm");
        String caution = textValue(itemNode, "atpnQesitm");
        if (StringUtils.hasText(warning) && StringUtils.hasText(caution)) {
            return warning + "\n\n" + caution;
        }
        return StringUtils.hasText(warning) ? warning : caution;
    }

    private String buildDescription(JsonNode itemNode) {
        String deposit = textValue(itemNode, "depositMethodQesitm");
        String interaction = textValue(itemNode, "intrcQesitm");

        if (StringUtils.hasText(deposit) && StringUtils.hasText(interaction)) {
            return "보관 방법\n" + deposit + "\n\n상호 작용\n" + interaction;
        }
        return StringUtils.hasText(deposit) ? deposit : interaction;
    }

    private String textValue(JsonNode node, String fieldName) {
        if (node == null || node.isMissingNode()) {
            return null;
        }
        JsonNode valueNode = node.get(fieldName);
        if (valueNode == null || valueNode.isNull()) {
            return null;
        }
        String text = valueNode.asText().trim();
        return text.isEmpty() ? null : text;
    }
}
