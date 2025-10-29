package com.ll.guardian.domain.medicine.repository;

import com.ll.guardian.domain.medicine.entity.Medicine;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MedicineRepository extends JpaRepository<Medicine, Long> {

    Optional<Medicine> findByProductCode(String productCode);

    List<Medicine> findByNameContainingIgnoreCase(String namePart);
}
