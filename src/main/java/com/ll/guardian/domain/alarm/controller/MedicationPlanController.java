package com.ll.guardian.domain.alarm.controller;

import com.ll.guardian.domain.alarm.dto.MedicationPlanBatchRequest;
import com.ll.guardian.domain.alarm.dto.MedicationPlanRequest;
import com.ll.guardian.domain.alarm.dto.MedicationPlanResponse;
import com.ll.guardian.domain.alarm.dto.MedicationPlanUpdateRequest;
import com.ll.guardian.domain.alarm.service.MedicationPlanService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/clients/{clientId}/medication/plans")
public class MedicationPlanController {

    private final MedicationPlanService medicationPlanService;

    public MedicationPlanController(MedicationPlanService medicationPlanService) {
        this.medicationPlanService = medicationPlanService;
    }

    @GetMapping
    public ResponseEntity<List<MedicationPlanResponse>> getPlans(@PathVariable Long clientId) {
        List<MedicationPlanResponse> plans = medicationPlanService.getPlans(clientId);
        return ResponseEntity.ok(plans);
    }

    @PostMapping
    public ResponseEntity<MedicationPlanResponse> createPlan(
            @PathVariable Long clientId, @Valid @RequestBody MedicationPlanRequest request) {
        MedicationPlanResponse response = medicationPlanService.createPlan(clientId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/batch")
    public ResponseEntity<List<MedicationPlanResponse>> createPlans(
            @PathVariable Long clientId, @Valid @RequestBody MedicationPlanBatchRequest request) {
        List<MedicationPlanResponse> responses = medicationPlanService.createPlans(clientId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(responses);
    }

    @PutMapping("/{planId}")
    public ResponseEntity<MedicationPlanResponse> updatePlan(
            @PathVariable Long clientId,
            @PathVariable Long planId,
            @Valid @RequestBody MedicationPlanUpdateRequest request) {
        MedicationPlanResponse response = medicationPlanService.updatePlan(clientId, planId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{planId}")
    public ResponseEntity<Void> deletePlan(@PathVariable Long clientId, @PathVariable Long planId) {
        medicationPlanService.deletePlan(clientId, planId);
        return ResponseEntity.noContent().build();
    }
}
