// src/main/java/com/ll/guardian/domain/edrug/client/EasyDrugClient.java
package com.ll.guardian.domain.edrug.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ll.guardian.domain.edrug.dto.DrugDetail;
import com.ll.guardian.domain.edrug.dto.DrugSummary;
import com.ll.guardian.domain.edrug.properties.EasyDrugProperties;
import com.ll.guardian.domain.edrug.repository.DrugInfoRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Repository;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.netty.http.client.HttpClient;
import reactor.netty.tcp.TcpClient;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

@Slf4j
@Repository
@RequiredArgsConstructor
public class EasyDrugClient implements DrugInfoRepository {

    private final EasyDrugProperties props;
    private WebClient webClient;
    private final ObjectMapper om = new ObjectMapper();

    @PostConstruct
    void init() {
        int connectTimeoutMs = props.connectTimeoutMs() != null ? props.connectTimeoutMs() : 2000;
        int readTimeoutMs    = props.readTimeoutMs()    != null ? props.readTimeoutMs()    : 5000;

        TcpClient tcp = TcpClient.create()
                .option(io.netty.channel.ChannelOption.CONNECT_TIMEOUT_MILLIS, connectTimeoutMs)
                .doOnConnected(conn -> conn
                        .addHandlerLast(new io.netty.handler.timeout.ReadTimeoutHandler(readTimeoutMs, java.util.concurrent.TimeUnit.MILLISECONDS))
                        .addHandlerLast(new io.netty.handler.timeout.WriteTimeoutHandler(readTimeoutMs, java.util.concurrent.TimeUnit.MILLISECONDS)));

        ExchangeStrategies strategies = ExchangeStrategies.builder()
                .codecs(c -> c.defaultCodecs().maxInMemorySize(5 * 1024 * 1024)) // 5MB
                .build();

        this.webClient = WebClient.builder()
                .baseUrl(props.baseUrl()) // 예: https://apis.data.go.kr/1471000/DrbEasyDrugInfoService
                .clientConnector(new org.springframework.http.client.reactive.ReactorClientHttpConnector(HttpClient.from(tcp)))
                .exchangeStrategies(strategies)
                .build();
    }

    // ----------------------
    // 검색 (요약 리스트)
    // ----------------------
    @Override
    public List<DrugSummary> search(String query, int page, int size) {
        if (!StringUtils.hasText(query)) return List.of();

        int safePage = Math.max(1, page);
        int safeSize = Math.max(1, Math.min(100, size));

        String url = UriComponentsBuilder.fromPath("/getDrbEasyDrugList")
                .queryParam("serviceKey", normalizedServiceKey())
                .queryParam("itemName", query)     // 수동 인코딩 금지
                .queryParam("pageNo", safePage)
                .queryParam("numOfRows", safeSize)
                .queryParam("type", "json")
                .build()                           // ❗ build()
                .encode(StandardCharsets.UTF_8)    // ❗ 반드시 encode(UTF-8)
                .toUriString();

        try {
            String body = webClient.get()
                    .uri(url)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .onStatus(s -> s.isError(),
                            resp -> resp.bodyToMono(String.class).map(b ->
                                    new IllegalStateException("MFDS HTTP " + resp.statusCode() + " body=" + b)))
                    .bodyToMono(String.class)
                    .timeout(Duration.ofMillis(props.readTimeoutMs() != null ? props.readTimeoutMs() : 5000))
                    .block();

            if (body == null) return List.of();

            JsonNode root = om.readTree(body);
            // (선택) 응답코드 로그
            String code = root.at("/header/resultCode").asText();
            if (code.isBlank()) code = root.at("/response/header/resultCode").asText();

            String msg = root.at("/header/resultMsg").asText();
            if (msg.isBlank()) msg = root.at("/response/header/resultMsg").asText();
            if (log.isDebugEnabled()) log.debug("MFDS search url={} resultCode={} resultMsg={}", url, code, msg);

            List<DrugSummary> list = new ArrayList<>();
            JsonNode items = root.at("/body/items");
            if (!items.isMissingNode() && !items.isNull()) addSummaries(list, normalizeItems(items));

            if (list.isEmpty()) {
                JsonNode items2 = root.at("/response/body/items/item");
                if (!items2.isMissingNode() && !items2.isNull()) addSummaries(list, normalizeItems(items2));
            }

            if (log.isDebugEnabled()) log.debug("MFDS search '{}' -> {} rows", query, list.size());
            return list;
        } catch (Exception e) {
            log.warn("search API 실패: {} (url={})", e.toString(), url);
            return List.of();
        }
    }

    // ----------------------
    // 상세 (name 우선 → seq → seq로 name 역탐색 후 name 재시도)
    // ----------------------
    @Override
    public Optional<DrugDetail> findDetail(String itemSeq, String itemName) {
        // 1) name 우선
        if (StringUtils.hasText(itemName)) {
            // 원본 이름 + 변형(괄호 제거, 앞뒤공백 트림)까지 시도
            for (String candidate : nameCandidates(itemName)) {
                var byName = callDetailBy("itemName", candidate);
                if (byName.isPresent()) return byName;
            }
        }

        // 2) itemSeq
        if (StringUtils.hasText(itemSeq)) {
            var bySeq = callDetailBy("itemSeq", itemSeq);
            if (bySeq.isPresent()) return bySeq;
        }

        // 3) seq → name 역탐색 → name으로 재시도
        if (StringUtils.hasText(itemSeq)) {
            var nameFromSeq = findItemNameByItemSeq(itemSeq);
            if (nameFromSeq.isPresent()) {
                for (String candidate : nameCandidates(nameFromSeq.get())) {
                    var byName2 = callDetailBy("itemName", candidate);
                    if (byName2.isPresent()) return byName2;
                }
            }
        }
        return Optional.empty();
    }

    // 하위호환 (있다면)
    @Override
    public Optional<DrugDetail> findDetailByItemSeq(String itemSeq) {
        return findDetail(itemSeq, null); // 내부에서 callDetailBy("itemSeq", ...) 수행
    }

    private List<String> nameCandidates(String raw) {
        String trimmed = raw.trim();
        // "타이레놀정 500mg (존슨앤드존슨)" → 괄호 앞까지만, 다중 스페이스 정리
        String noParen = trimmed.replaceAll("\\s*\\(.*?\\)\\s*", " ").replaceAll("\\s+", " ").trim();
        if (noParen.isEmpty() || noParen.equalsIgnoreCase(trimmed)) {
            return List.of(trimmed);
        }
        return List.of(trimmed, noParen);
    }

    private Optional<String> findItemNameByItemSeq(String itemSeq) {
        String url = UriComponentsBuilder.fromPath("/getDrbEasyDrugList")
                .queryParam("serviceKey", normalizedServiceKey())
                .queryParam("itemSeq", itemSeq)
                .queryParam("numOfRows", 1)
                .queryParam("type", "json")
                .build()
                .encode(StandardCharsets.UTF_8)    // ❗
                .toUriString();

        try {
            String body = webClient.get()
                    .uri(url)
                    .retrieve()
                    .onStatus(s -> s.isError(),
                            resp -> resp.bodyToMono(String.class).map(b ->
                                    new IllegalStateException("MFDS HTTP " + resp.statusCode() + " body=" + b)))
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(5))
                    .block();
            if (body == null) return Optional.empty();

            JsonNode root = om.readTree(body);

            JsonNode items = root.at("/body/items");
            if (!items.isMissingNode() && !items.isNull()) {
                for (JsonNode n : normalizeItems(items)) {
                    String name = text(n, "itemName");
                    if (!name.isBlank()) return Optional.of(name);
                }
            }
            JsonNode items2 = root.at("/response/body/items/item");
            if (!items2.isMissingNode() && !items2.isNull()) {
                for (JsonNode n : normalizeItems(items2)) {
                    String name = text(n, "itemName");
                    if (!name.isBlank()) return Optional.of(name);
                }
            }
            return Optional.empty();
        } catch (Exception e) {
            if (log.isDebugEnabled()) log.debug("findItemNameByItemSeq 실패(url={}): {}", url, e.toString());
            return Optional.empty();
        }
    }

    private Optional<DrugDetail> callDetailBy(String key, String value) {
        // 상세도 getDrbEasyDrugList 사용 (InfoList 아님)
        String url = UriComponentsBuilder.fromPath("/getDrbEasyDrugList")
                .queryParam("serviceKey", normalizedServiceKey())
                .queryParam("type", "json")
                .queryParam("numOfRows", 1)
                .queryParam(key, value)                 // 한글/괄호 포함 가능 (encode로 처리)
                .build()
                .encode(StandardCharsets.UTF_8)         // ❗ 핵심
                .toUriString();

        try {
            String body = webClient.get()
                    .uri(url)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofMillis(props.readTimeoutMs() != null ? props.readTimeoutMs() : 5000))
                    .block();

            if (body == null || body.isBlank()) return Optional.empty();

            var root = om.readTree(body);
            var nodes = normalizeItems(root.at("/body/items"));
            if (nodes.isEmpty()) nodes = normalizeItems(root.at("/response/body/items/item"));
            if (nodes.isEmpty()) return Optional.empty();

            return Optional.of(mapDetail(nodes.get(0)));
        } catch (Exception e) {
            log.warn("detail API 실패({}='{}'): {}", key, value, e.toString());
            return Optional.empty();
        }
    }

    // ============ 매핑 유틸 ============

    private List<JsonNode> normalizeItems(JsonNode itemsNode) {
        List<JsonNode> list = new ArrayList<>();
        if (itemsNode == null || itemsNode.isNull()) return list;

        if (itemsNode.isArray()) {
            itemsNode.forEach(list::add);
        } else if (itemsNode.isObject()) {
            JsonNode item = itemsNode.get("item");
            if (item != null && !item.isNull()) {
                if (item.isArray()) item.forEach(list::add);
                else list.add(item);
            } else {
                list.add(itemsNode);
            }
        }
        return list;
    }

    private void addSummaries(List<DrugSummary> out, List<JsonNode> nodes) {
        for (JsonNode n : nodes) out.add(mapSummary(n));
    }

    private DrugSummary mapSummary(JsonNode n) {
        return DrugSummary.builder()
                .itemSeq(text(n, "itemSeq"))
                .itemName(text(n, "itemName"))
                .entpName(text(n, "entpName"))
                .etcOtcName(text(n, "etcOtcName"))
                .className(text(n, "className"))
                .chart(text(n, "chart"))
                .itemImage(firstNonEmpty(text(n, "itemImage"), text(n, "itemImage2")))
                .build();
    }

    private DrugDetail mapDetail(JsonNode n) {
        return DrugDetail.builder()
                .itemSeq(text(n, "itemSeq"))
                .itemName(text(n, "itemName"))
                .entpName(text(n, "entpName"))
                .className(text(n, "className"))
                .chart(text(n, "chart"))
                .itemImage(firstNonEmpty(text(n, "itemImage"), text(n, "itemImage2")))
                .etcOtcName(text(n, "etcOtcName"))
                .materialName(text(n, "materialName"))
                .openDe(text(n, "openDe"))
                .updateDe(text(n, "updateDe"))
                .efcyQesitm(text(n, "efcyQesitm"))
                .useMethodQesitm(text(n, "useMethodQesitm"))
                .atpnWarnQesitm(text(n, "atpnWarnQesitm"))
                .atpnQesitm(text(n, "atpnQesitm"))
                .intrcQesitm(text(n, "intrcQesitm"))
                .seQesitm(text(n, "seQesitm"))
                .depositMethodQesitm(text(n, "depositMethodQesitm"))
                .build();
    }

    private static String text(JsonNode n, String field) {
        JsonNode v = n.get(field);
        return (v == null || v.isNull()) ? "" : v.asText();
    }

    private String firstNonEmpty(String... values) {
        for (String v : values) {
            if (StringUtils.hasText(v)) {
                // 🔹 이미지 URL 같은 경우 http -> https로 변경
                if (v.startsWith("http://")) {
                    return "https://" + v.substring("http://".length());
                }
                return v;
            }
        }
        return "";
    }
    private String normalizedServiceKey() {
        String key = props.serviceKey();
        if (key == null) return null;
        // 이미 인코딩돼 있다면(%, + 등) 디코딩
        if (key.contains("%") || key.contains("+")) {
            try {
                return URLDecoder.decode(key, StandardCharsets.UTF_8);
            } catch (Exception ignore) { /* 그냥 원본 사용 */ }
        }
        return key.trim();
    }
}
