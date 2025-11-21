package com.ll.guardian.domain.user;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum UserRole {
    CLIENT,
    MANAGER,
    ADMIN;

    // Accept legacy "PROVIDER" payloads by mapping them to MANAGER to keep enums consistent.
    @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public static UserRole from(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim().toUpperCase();
        if ("PROVIDER".equals(normalized)) {
            return MANAGER;
        }
        return UserRole.valueOf(normalized);
    }

    @JsonValue
    public String toValue() {
        return name();
    }
}
