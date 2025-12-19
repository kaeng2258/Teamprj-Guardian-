package com.ll.guardian.domain.auth.repository;

import com.ll.guardian.domain.auth.entity.BlacklistedToken;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BlacklistedTokenRepository extends JpaRepository<BlacklistedToken, Long> {

    Optional<BlacklistedToken> findByTokenHash(String tokenHash);

    boolean existsByTokenHash(String tokenHash);

    long deleteByExpiresAtBefore(LocalDateTime now);
}
