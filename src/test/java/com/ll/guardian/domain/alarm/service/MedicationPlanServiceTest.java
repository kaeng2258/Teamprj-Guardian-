package com.ll.guardian.domain.alarm.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.ll.guardian.domain.alarm.dto.ManualMedicineRequest;
import com.ll.guardian.domain.alarm.dto.MedicationPlanRequest;
import com.ll.guardian.domain.alarm.dto.MedicationPlanResponse;
import com.ll.guardian.domain.user.UserRole;
import com.ll.guardian.domain.user.UserStatus;
import com.ll.guardian.domain.user.entity.User;
import com.ll.guardian.domain.user.repository.UserRepository;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class MedicationPlanServiceTest {

    @Autowired
    private MedicationPlanService medicationPlanService;

    @Autowired
    private UserRepository userRepository;

    @Test
    void createPlanWithManualMedicinePersistsMedicineId() {
        User client = userRepository.save(
                User.builder()
                        .email("manual-client@example.com")
                        .password("encoded-password")
                        .name("수기 등록 클라이언트")
                        .role(UserRole.CLIENT)
                        .status(UserStatus.ACTIVE)
                        .build());

        MedicationPlanRequest request = new MedicationPlanRequest(
                null,
                new ManualMedicineRequest(
                        "직접 입력 약품",
                        null,
                        "효능 설명",
                        null,
                        null,
                        null,
                        null),
                1,
                "정",
                LocalTime.of(8, 0),
                List.of("MONDAY"));

        MedicationPlanResponse response = medicationPlanService.createPlan(client.getId(), request);

        assertThat(response.medicineId()).isNotNull();
        assertThat(response.medicineName()).isEqualTo("직접 입력 약품");
    }
}

