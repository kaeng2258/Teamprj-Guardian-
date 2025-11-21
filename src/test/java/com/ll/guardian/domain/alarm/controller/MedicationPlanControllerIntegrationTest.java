package com.ll.guardian.domain.alarm.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ll.guardian.domain.medicine.entity.Medicine;
import com.ll.guardian.domain.medicine.repository.MedicineRepository;
import com.ll.guardian.domain.user.UserRole;
import com.ll.guardian.domain.user.UserStatus;
import com.ll.guardian.domain.user.entity.User;
import com.ll.guardian.domain.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MedicationPlanControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MedicineRepository medicineRepository;

    private Long clientId;
    private Long medicineId;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        medicineRepository.deleteAll();

        User client = userRepository.save(User.builder()
                .email("client@example.com")
                .password("password")
                .name("테스트 클라이언트")
                .role(UserRole.CLIENT)
                .status(UserStatus.ACTIVE)
                .build());

        Medicine medicine = medicineRepository.save(Medicine.builder()
                .productCode("12345")
                .name("테스트 약품")
                .build());

        this.clientId = client.getId();
        this.medicineId = medicine.getId();
    }

    @Test
    void createPlans_acceptsTimeWithoutSeconds() throws Exception {
        String payload = objectMapper.writeValueAsString(new Object() {
            public final String alarmTime = "08:30";
            public final String[] daysOfWeek = {"MONDAY"};
            public final Object[] items = {new Object() {
                public final Long medicineId = MedicationPlanControllerIntegrationTest.this.medicineId;
                public final int dosageAmount = 1;
                public final String dosageUnit = "알";
            }};
        });

        mockMvc.perform(post("/api/clients/" + clientId + "/medication/plans/batch")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated());
    }
}
