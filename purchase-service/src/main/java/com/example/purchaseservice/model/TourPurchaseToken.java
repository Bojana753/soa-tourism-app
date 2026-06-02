package com.example.purchaseservice.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "tour_purchase_tokens")
@Data
public class TourPurchaseToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long touristId;

    @Column(nullable = false)
    private Long tourId;

    private String tourName;

    private LocalDateTime purchasedAt = LocalDateTime.now();
}
