package com.ll.guardian.global.exception;

import org.springframework.http.HttpStatus;

public class GuardianException extends RuntimeException {

    private final HttpStatus status;

    public GuardianException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
