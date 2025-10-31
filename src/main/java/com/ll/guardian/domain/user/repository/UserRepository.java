package com.ll.guardian.domain.user.repository;

import com.ll.guardian.domain.user.UserRole;
import com.ll.guardian.domain.user.entity.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    List<User> findByRole(UserRole role);

    long countByRole(UserRole role);

    @EntityGraph(attributePaths = "clientProfile")
    @Query("SELECT u FROM User u WHERE u.role = :role AND (LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<User> searchByRoleAndKeyword(
            @Param("role") UserRole role, @Param("keyword") String keyword, Pageable pageable);

    @EntityGraph(attributePaths = "clientProfile")
    Optional<User> findByIdAndRole(Long id, UserRole role);
}
