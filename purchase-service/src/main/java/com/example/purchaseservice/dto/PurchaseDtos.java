package com.example.purchaseservice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

public class PurchaseDtos {

    @Data
    public static class AddToCartRequest {
        @NotNull
        private Long touristId;
        @NotNull
        private Long tourId;
        @NotNull
        private String tourName;
        @NotNull
        private Double price;
    }

    @Data
    public static class CartResponse {
        private Long id;
        private Long touristId;
        private List<OrderItemResponse> items;
        private double totalPrice;
    }

    @Data
    public static class OrderItemResponse {
        private Long id;
        private Long tourId;
        private String tourName;
        private double price;
    }

    @Data
    public static class CheckoutRequest {
        @NotNull
        private Long touristId;
    }

    @Data
    public static class CheckoutResponse {
        private List<TokenResponse> tokens;
        private String message;
    }

    @Data
    public static class TokenResponse {
        private Long id;
        private Long touristId;
        private Long tourId;
        private String tourName;
        private LocalDateTime purchasedAt;
    }

    @Data
    public static class PurchaseCheckResponse {
        private boolean purchased;
        private Long touristId;
        private Long tourId;
    }
}
