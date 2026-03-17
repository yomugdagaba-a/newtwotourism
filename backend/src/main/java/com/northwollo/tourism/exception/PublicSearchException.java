package com.northwollo.tourism.exception;

public class PublicSearchException extends RuntimeException {

    public PublicSearchException(String message) {
        super(message);
    }

    public PublicSearchException(String message, Throwable cause) {
        super(message, cause);
    }
}
