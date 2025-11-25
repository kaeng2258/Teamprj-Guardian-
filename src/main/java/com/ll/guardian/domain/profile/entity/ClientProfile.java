package com.ll.guardian.domain.profile.entity;

import com.ll.guardian.global.common.BaseTimeEntity;
import com.ll.guardian.domain.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
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
@Table(name = "profile")
public class ClientProfile extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "profile_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_user_id", nullable = false, unique = true)
    private User client;

    @Column(name = "address", nullable = false, length = 255)
    private String address;

    @Column(name = "detail_address", length = 255)
    private String detailAddress;

    @Column(name = "zip_code", length = 20)
    private String zipCode;

    @Column(name = "age", nullable = false)
    private Integer age;

    @Column(name = "medical_notes", columnDefinition = "TEXT")
    private String medicalNotes;

    @Column(name = "medication_cycle", nullable = false, length = 255)
    private String medicationCycle;

    public void updateProfile(
            String address,
            String detailAddress,
            String zipCode,
            Integer age,
            String medicalNotes,
            String medicationCycle) {
        this.address = address;
        this.detailAddress = detailAddress;
        this.zipCode = zipCode;
        this.age = age;
        this.medicalNotes = medicalNotes;
        this.medicationCycle = medicationCycle;
    }
}
