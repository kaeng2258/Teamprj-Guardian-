package com.ll.guardian.domain.auth.repository;

import com.ll.guardian.domain.auth.entity.RefreshToken;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select rt from RefreshToken rt where rt.token = :token")
    Optional<RefreshToken> findByTokenForUpdate(@Param("token") String token);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select rt from RefreshToken rt where rt.user.id = :userId")
    Optional<RefreshToken> findByUserIdForUpdate(@Param("userId") Long userId);

    void deleteByUserId(Long userId);
}
