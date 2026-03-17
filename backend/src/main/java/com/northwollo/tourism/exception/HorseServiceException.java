package com.northwollo.tourism.exception;

public class HorseServiceException extends RuntimeException {
    public HorseServiceException(String message) {
        super(message);
    }

    public HorseServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
