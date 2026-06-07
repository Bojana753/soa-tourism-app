package com.example.tourservice.exception;

public class PurchaseServiceUnavailableException extends RuntimeException {
    public PurchaseServiceUnavailableException(String message) {
        super(message);
    }
}
