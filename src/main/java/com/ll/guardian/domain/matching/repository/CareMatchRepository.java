package com.ll.guardian.domain.matching.repository;

import com.ll.guardian.domain.matching.entity.CareMatch;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CareMatchRepository extends JpaRepository<CareMatch, Long> {

    List<CareMatch> findByClientId(Long clientId);

    List<CareMatch> findByManagerId(Long managerId);

    List<CareMatch> findByClientIdInAndCurrentTrue(Collection<Long> clientIds);

    Optional<CareMatch> findFirstByClientIdAndCurrentTrue(Long clientId);
}
