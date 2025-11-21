package com.ll.guardian.domain.alarm.controller;

import com.ll.guardian.domain.alarm.dto.MedicationLogRequest;
import com.ll.guardian.domain.alarm.dto.MedicationLogResponse;
import com.ll.guardian.domain.alarm.dto.MedicationWeeklySummaryResponse;
import com.ll.guardian.domain.alarm.service.MedicationLogService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/clients/{clientId}/medication/logs")
public class MedicationLogController {

    private final MedicationLogService medicationLogService;

    public MedicationLogController(MedicationLogService medicationLogService) {
        this.medicationLogService = medicationLogService;
    }

    @PostMapping
    public ResponseEntity<MedicationLogResponse> record(
            @PathVariable Long clientId, @Valid @RequestBody MedicationLogRequest request) {
        MedicationLogResponse response = medicationLogService.record(clientId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{logId}")
    public ResponseEntity<MedicationLogResponse> update(
            @PathVariable Long clientId,
            @PathVariable Long logId,
            @Valid @RequestBody MedicationLogRequest request) {
        MedicationLogResponse response = medicationLogService.update(logId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{logId}")
    public ResponseEntity<Void> delete(@PathVariable Long clientId, @PathVariable Long logId) {
        medicationLogService.delete(logId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<MedicationLogResponse>> getLogs(
            @PathVariable Long clientId,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<MedicationLogResponse> logs = medicationLogService.getLogs(clientId, date);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/weekly")
    public ResponseEntity<MedicationWeeklySummaryResponse> getWeeklySummary(
            @PathVariable Long clientId,
            @RequestParam(name = "endDate", required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate endDate) {
        MedicationWeeklySummaryResponse response = medicationLogService.getWeeklySummary(clientId, endDate);
        return ResponseEntity.ok(response);
    }
}
