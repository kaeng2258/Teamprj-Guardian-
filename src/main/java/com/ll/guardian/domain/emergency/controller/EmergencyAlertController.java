package com.ll.guardian.domain.emergency.controller;

import com.ll.guardian.domain.emergency.dto.EmergencyAlertRequest;
import com.ll.guardian.domain.emergency.dto.EmergencyAlertResponse;
import com.ll.guardian.domain.emergency.service.EmergencyAlertService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import java.security.Principal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/emergency/alerts")
public class EmergencyAlertController {

    private final EmergencyAlertService emergencyAlertService;

    public EmergencyAlertController(EmergencyAlertService emergencyAlertService) {
        this.emergencyAlertService = emergencyAlertService;
    }

    @PostMapping
    public ResponseEntity<EmergencyAlertResponse> trigger(
            @Valid @RequestBody EmergencyAlertRequest request,
            Principal principal) {
        String requesterEmail = principal != null ? principal.getName() : null;
        EmergencyAlertResponse response = emergencyAlertService.triggerAlert(request, requesterEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<?> listByClient(@PathVariable Long clientId) {
        return ResponseEntity.ok(emergencyAlertService.findByClient(clientId));
    }

    @PostMapping("/acknowledge-all")
    public ResponseEntity<?> acknowledgeAll(@RequestParam Long managerId) {
        return ResponseEntity.ok(emergencyAlertService.acknowledgeAllPending(managerId));
    }
}
