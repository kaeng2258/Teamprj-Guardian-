package com.ll.guardian.domain.chat.entity;

import com.ll.guardian.domain.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
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
@Table(
        name = "chat_room",
        uniqueConstraints = {
            @UniqueConstraint(name = "uk_chat_room_pair", columnNames = {"client_user_id", "provider_user_id"})
        })
public class ChatRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_user_id", nullable = false)
    private User client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_user_id", nullable = false)
    private User provider;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "last_message_snippet", length = 255)
    private String lastMessageSnippet;

    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    @Column(name = "is_read_client", nullable = false)
    private boolean readByClient;

    @Column(name = "is_read_provider", nullable = false)
    private boolean readByProvider;

    @PrePersist
    private void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public void updateLastMessage(String snippet, LocalDateTime sentAt, Long senderId) {
        this.lastMessageSnippet = snippet;
        this.lastMessageAt = sentAt;
        this.readByClient = client.getId().equals(senderId);
        this.readByProvider = provider.getId().equals(senderId);
    }

    public void markAsReadByClient() {
        this.readByClient = true;
    }

    public void markAsReadByProvider() {
        this.readByProvider = true;
    }
}
