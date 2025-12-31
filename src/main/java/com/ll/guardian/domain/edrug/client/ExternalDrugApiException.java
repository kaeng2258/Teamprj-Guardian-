package com.ll.guardian.domain.edrug.client;

import org.springframework.http.HttpStatus;

public class ExternalDrugApiException extends RuntimeException {
    private final HttpStatus status;
    private final String url;

    public ExternalDrugApiException(HttpStatus status, String message, String url, Throwable cause) {
        super(message, cause);
        this.status = status;
        this.url = url;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getUrl() {
        return url;
    }
}

