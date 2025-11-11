package com.ll.guardian.domain.medicine.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ll.guardian.domain.medicine.entity.Medicine;
import com.ll.guardian.domain.medicine.repository.MedicineRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

@ExtendWith(MockitoExtension.class)
class DrugInfoServiceTest {

    @Mock
    private MedicineRepository medicineRepository;

    private RestTemplate restTemplate;
    private MockRestServiceServer mockServer;
    private DrugInfoService drugInfoService;

    @BeforeEach
    void setUp() {
        restTemplate = new RestTemplate();
        mockServer = MockRestServiceServer.bindTo(restTemplate).ignoreExpectOrder(true).build();
        drugInfoService = new DrugInfoService(
                medicineRepository, restTemplate, new ObjectMapper(), "http://example.com", "service-key");
    }

    @Test
    void searchByKeyword_fetchesFromEasydrugAndPersistsResults() {
        String keyword = "타이레놀";
        String apiResponse = """
                {
                  "header": { "resultCode": "00", "resultMsg": "NORMAL SERVICE." },
                  "body": {
                    "items": [
                      {
                        "itemSeq": "12345",
                        "itemName": "타이레놀 500mg",
                        "efcyQesitm": "효능",
                        "useMethodQesitm": "용법"
                      }
                    ]
                  }
                }
                """;

        mockServer.expect(requestTo(containsString("/getDrbEasyDrugInfoList")))
                .andRespond(withSuccess(apiResponse, MediaType.APPLICATION_JSON));

        Medicine persisted = Medicine.builder().id(1L).productCode("12345").name("타이레놀 500mg").build();
        when(medicineRepository.findByProductCode("12345")).thenReturn(Optional.empty());
        when(medicineRepository.save(any(Medicine.class))).thenReturn(persisted);
        when(medicineRepository.findByNameContainingIgnoreCase(keyword)).thenReturn(List.of(persisted));

        List<Medicine> result = drugInfoService.searchByKeyword(keyword);

        assertThat(result).containsExactly(persisted);
        verify(medicineRepository).save(argThat(medicine -> medicine != null && "12345".equals(medicine.getProductCode())));
        mockServer.verify();
    }

    @Test
    void searchByKeyword_returnsEmptyWhenKeywordBlank() {
        List<Medicine> result = drugInfoService.searchByKeyword("   ");
        assertThat(result).isEmpty();
        verifyNoInteractions(medicineRepository);
    }

}
