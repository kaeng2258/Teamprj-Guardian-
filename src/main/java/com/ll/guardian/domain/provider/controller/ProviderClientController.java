package com.ll.guardian.domain.provider.controller;

import com.ll.guardian.domain.matching.dto.CareAssignmentRequest;
import com.ll.guardian.domain.matching.dto.CareAssignmentResponse;
import com.ll.guardian.domain.matching.service.CareAssignmentService;
import com.ll.guardian.domain.provider.dto.ProviderAssignRequest;
import com.ll.guardian.domain.provider.dto.ProviderClientSearchResponse;
import com.ll.guardian.domain.provider.service.ProviderClientService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/providers/{providerId}/clients")
public class ProviderClientController {

    private final ProviderClientService providerClientService;
    private final CareAssignmentService careAssignmentService;

    public ProviderClientController(
            ProviderClientService providerClientService, CareAssignmentService careAssignmentService) {
        this.providerClientService = providerClientService;
        this.careAssignmentService = careAssignmentService;
    }

    @GetMapping("/search")
    public ResponseEntity<List<ProviderClientSearchResponse>> searchClients(
            @PathVariable Long providerId,
            @RequestParam("keyword") String keyword,
            @RequestParam(name = "size", required = false) Integer size) {
        List<ProviderClientSearchResponse> response = providerClientService.searchClients(providerId, keyword, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{clientId}")
    public ResponseEntity<ProviderClientSearchResponse> getClientDetail(
            @PathVariable Long providerId, @PathVariable Long clientId) {
        ProviderClientSearchResponse response = providerClientService.getClientDetail(providerId, clientId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/assignments")
    public ResponseEntity<CareAssignmentResponse> assignClient(
            @PathVariable Long providerId, @Valid @RequestBody ProviderAssignRequest request) {
        CareAssignmentResponse response = careAssignmentService.assign(
                new CareAssignmentRequest(request.clientId(), providerId, request.startDate(), request.endDate()));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
