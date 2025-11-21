package com.ll.guardian.domain.manager.controller;

import com.ll.guardian.domain.matching.dto.CareAssignmentRequest;
import com.ll.guardian.domain.matching.dto.CareAssignmentResponse;
import com.ll.guardian.domain.matching.service.CareAssignmentService;
import com.ll.guardian.domain.manager.dto.ManagerAssignRequest;
import com.ll.guardian.domain.manager.dto.ManagerClientSearchResponse;
import com.ll.guardian.domain.manager.service.ManagerClientService;
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
@RequestMapping("/api/managers/{managerId}/clients")
public class ManagerClientController {

    private final ManagerClientService managerClientService;
    private final CareAssignmentService careAssignmentService;

    public ManagerClientController(
            ManagerClientService managerClientService, CareAssignmentService careAssignmentService) {
        this.managerClientService = managerClientService;
        this.careAssignmentService = careAssignmentService;
    }

    @GetMapping("/search")
    public ResponseEntity<List<ManagerClientSearchResponse>> searchClients(
            @PathVariable Long managerId,
            @RequestParam("keyword") String keyword,
            @RequestParam(name = "size", required = false) Integer size) {
        List<ManagerClientSearchResponse> response = managerClientService.searchClients(managerId, keyword, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{clientId}")
    public ResponseEntity<ManagerClientSearchResponse> getClientDetail(
            @PathVariable Long managerId, @PathVariable Long clientId) {
        ManagerClientSearchResponse response = managerClientService.getClientDetail(managerId, clientId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/assignments")
    public ResponseEntity<CareAssignmentResponse> assignClient(
            @PathVariable Long managerId, @Valid @RequestBody ManagerAssignRequest request) {
        CareAssignmentResponse response = careAssignmentService.assign(
                new CareAssignmentRequest(request.clientId(), managerId, request.startDate(), request.endDate()));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
