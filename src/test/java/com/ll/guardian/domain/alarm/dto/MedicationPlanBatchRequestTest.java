package com.ll.guardian.domain.alarm.dto;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.time.LocalTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class MedicationPlanBatchRequestTest {

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    @Test
    void deserializeAlarmTimeWithoutSeconds() throws Exception {
        String json = "{" +
                "\"alarmTime\":\"08:30\"," +
                "\"daysOfWeek\":[\"MONDAY\"]," +
                "\"items\":[{" +
                "\"medicineId\":1," +
                "\"dosageAmount\":1," +
                "\"dosageUnit\":\"알\"}]}";

        MedicationPlanBatchRequest request = objectMapper.readValue(json, MedicationPlanBatchRequest.class);

        assertThat(request.alarmTime()).isEqualTo(LocalTime.of(8, 30));
    }
}
