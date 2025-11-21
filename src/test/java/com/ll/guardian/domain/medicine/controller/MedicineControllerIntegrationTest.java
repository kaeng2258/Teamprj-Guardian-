package com.ll.guardian.domain.medicine.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ll.guardian.domain.medicine.entity.Medicine;
import com.ll.guardian.domain.medicine.repository.MedicineRepository;
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
class MedicineControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void importFromEasyDrug_createsPlaceholderWhenApiKeyMissing() throws Exception {
        String payload = objectMapper.writeValueAsString(new ImportPayload("99999", "테스트 약품"));

        mockMvc.perform(post("/api/medicines/easy-drug/import")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("테스트 약품"));

        Medicine saved = medicineRepository.findByProductCode("99999").orElseThrow();
        assertThat(saved.getName()).isEqualTo("테스트 약품");
    }

    private record ImportPayload(String itemSeq, String itemName) {}
}
