package com.ll.guardian.domain.matching.repository;

import com.ll.guardian.domain.matching.entity.CareMatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CareMatchRepository extends JpaRepository<CareMatch, Long> {

    List<CareMatch> findByClientId(Long clientId);

    List<CareMatch> findByManagerId(Long managerId);

    List<CareMatch> findByManagerIdAndCurrentTrue(Long managerId);

    List<CareMatch> findByClientIdInAndCurrentTrue(Collection<Long> clientIds);

    List<CareMatch> findByClientIdAndCurrentTrue(Long clientId);

    Optional<CareMatch> findFirstByClientIdAndCurrentTrue(Long clientId);

    Optional<CareMatch> findFirstByClientIdAndManagerIdAndCurrentTrue(Long clientId, Long managerId);

    Optional<CareMatch> findFirstByClientIdOrderByIdDesc(Long clientId);

    List<CareMatch> findByClient_IdOrManager_Id(Long userId1, Long userId2);

}
