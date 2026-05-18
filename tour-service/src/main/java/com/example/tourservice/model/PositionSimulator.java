package com.example.tourservice.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "position_simulator")
@Data
public class PositionSimulator {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private Long touristId;

    private double latitude;
    private double longitude;

    private LocalDateTime updatedAt = LocalDateTime.now();
}
