package com.ll.guardian.domain.profile.repository;

import com.ll.guardian.domain.profile.entity.ClientProfile;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClientProfileRepository extends JpaRepository<ClientProfile, Long> {

    Optional<ClientProfile> findByClientId(Long clientId);

    void deleteByClient_Id(Long clientId);
}
