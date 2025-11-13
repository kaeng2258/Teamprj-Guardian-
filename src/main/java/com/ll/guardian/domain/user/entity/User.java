package com.ll.guardian.domain.user.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.ll.guardian.domain.user.UserRole;
import com.ll.guardian.domain.user.UserStatus;
import com.ll.guardian.global.common.BaseTimeEntity;
import com.ll.guardian.domain.profile.entity.ClientProfile;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @JsonIgnore
    @Column(name = "password", nullable = false, length = 255)
    private String password;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private UserStatus status;

    @Column(name = "profile_image_url", length = 512)
    private String profileImageUrl;

    @OneToOne(mappedBy = "client", fetch = FetchType.LAZY)
    private ClientProfile clientProfile;

    public void changePassword(String encodedPassword) {
        this.password = encodedPassword;
    }

    public void updateProfile(String name, String profileImageUrl, UserStatus status) {
        this.name = name;
        if (profileImageUrl != null) {
            this.profileImageUrl = profileImageUrl;
        }
        if (status != null) {
            this.status = status;
        }
    }
}
