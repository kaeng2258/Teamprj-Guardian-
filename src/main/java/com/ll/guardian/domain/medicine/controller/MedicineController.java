package com.ll.guardian.domain.medicine.controller;

import com.ll.guardian.domain.medicine.dto.EasyDrugImportRequest;
import com.ll.guardian.domain.medicine.dto.MedicineSummaryResponse;
import com.ll.guardian.domain.medicine.entity.Medicine;
import com.ll.guardian.domain.medicine.service.DrugInfoService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/medicines")
public class MedicineController {

    private final DrugInfoService drugInfoService;

    public MedicineController(DrugInfoService drugInfoService) {
        this.drugInfoService = drugInfoService;
    }

    @GetMapping("/search")
    public ResponseEntity<List<MedicineSummaryResponse>> search(@RequestParam("keyword") String keyword) {
        List<Medicine> medicines = drugInfoService.searchByKeyword(keyword);
        List<MedicineSummaryResponse> response = medicines.stream().map(MedicineSummaryResponse::from).toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{medicineId}")
    public ResponseEntity<MedicineSummaryResponse> getMedicine(@PathVariable Long medicineId) {
        Medicine medicine = drugInfoService.getMedicine(medicineId);
        return ResponseEntity.ok(MedicineSummaryResponse.from(medicine));
    }

    @PostMapping("/easy-drug/import")
    public ResponseEntity<MedicineSummaryResponse> importFromEasyDrug(
            @Valid @RequestBody EasyDrugImportRequest request) {
        Medicine medicine = drugInfoService.importFromEasyDrug(request.itemSeq(), request.itemName());
        return ResponseEntity.ok(MedicineSummaryResponse.from(medicine));
    }
}
