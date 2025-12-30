package com.ll.guardian.domain.admin.controller;

import com.ll.guardian.domain.admin.dto.AdminMedicationSummaryResponse;
import com.ll.guardian.domain.admin.dto.AdminOverviewResponse;
import com.ll.guardian.domain.admin.dto.AdminUserDetailResponse;
import com.ll.guardian.domain.admin.dto.AdminUserSummaryResponse;
import com.ll.guardian.domain.admin.dto.MedicationAdherenceResponse;
import com.ll.guardian.domain.admin.service.AdminDashboardService;
import com.ll.guardian.domain.emergency.entity.EmergencyAlert;
import com.ll.guardian.domain.notification.entity.Notification;
import com.ll.guardian.domain.user.UserRole;
import com.ll.guardian.domain.user.entity.User;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    public AdminDashboardController(AdminDashboardService adminDashboardService) {
        this.adminDashboardService = adminDashboardService;
    }

    /**
     * 관리자 메인 개요/통계 정보
     */
    @GetMapping("/overview")
    public ResponseEntity<AdminOverviewResponse> getOverview() {
        Map<String, Object> raw = adminDashboardService.getOverview();

        long clientCount = ((Number) raw.getOrDefault("clientCount", 0L)).longValue();
        long managerCount = ((Number) raw.getOrDefault("managerCount", 0L)).longValue();
        long activeMatches = ((Number) raw.getOrDefault("activeMatches", 0L)).longValue();

        @SuppressWarnings("unchecked")
        List<EmergencyAlert> alerts =
                (List<EmergencyAlert>) raw.getOrDefault("recentAlerts", List.of());

        @SuppressWarnings("unchecked")
        List<Notification> notifications =
                (List<Notification>) raw.getOrDefault("recentNotifications", List.of());

        AdminOverviewResponse body = AdminOverviewResponse.from(
                clientCount,
                managerCount,
                activeMatches,
                alerts,
                notifications
        );

        return ResponseEntity.ok(body);
    }

    /**
     * 사용자 검색(이름/이메일 + 역할)
     * 예) /api/admin/users?keyword=홍길동&role=CLIENT
     */
    @GetMapping("/users")
    public ResponseEntity<List<AdminUserSummaryResponse>> searchUsers(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) UserRole role
    ) {
        List<User> users = adminDashboardService.searchUsers(keyword, role);
        List<AdminUserSummaryResponse> body = users.stream()
                .map(AdminUserSummaryResponse::from)
                .toList();
        return ResponseEntity.ok(body);
    }

    /**
     * 투약 순응도 (기간 또는 최근 n개월)
     * 예) /api/admin/medication/adherence?months=6
     *    /api/admin/medication/adherence?from=2025-11-01&to=2025-11-24
     */
    @GetMapping("/medication/adherence")
    public ResponseEntity<MedicationAdherenceResponse> getMedicationAdherence(
            @RequestParam(required = false) Integer months,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        MedicationAdherenceResponse response =
                adminDashboardService.calculateMedicationAdherenceWithPoints(months, from, to);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<AdminUserDetailResponse> getUserDetail(@PathVariable Long id) {
        var user = adminDashboardService.getUserById(id);
        return ResponseEntity.ok(AdminUserDetailResponse.from(user));
    }

    @GetMapping("/users/{id}/medication-summary")
    public ResponseEntity<AdminMedicationSummaryResponse> getMedicationSummary(@PathVariable Long id) {
        return ResponseEntity.ok(adminDashboardService.getMedicationSummary(id));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        adminDashboardService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}

