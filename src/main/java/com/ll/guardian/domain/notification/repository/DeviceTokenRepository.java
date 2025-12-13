package com.ll.guardian.domain.notification.repository;

import com.ll.guardian.domain.notification.entity.DeviceToken;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeviceTokenRepository extends JpaRepository<DeviceToken, Long> {

    Optional<DeviceToken> findByToken(String token);

    List<DeviceToken> findByUserIdAndActiveTrue(Long userId);

    void deleteByUser_Id(Long userId);

}
