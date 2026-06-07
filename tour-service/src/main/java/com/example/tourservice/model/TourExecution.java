package com.example.tourservice.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "tour_executions")
@Data
public class TourExecution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long tourId;

    @Column(nullable = false)
    private Long touristId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExecutionStatus status = ExecutionStatus.ACTIVE;

    private int nextKeyPointIndex = 0;
    private Double lastLatitude;
    private Double lastLongitude;
    private LocalDateTime startedAt = LocalDateTime.now();
    private LocalDateTime lastActivityAt;
    private LocalDateTime completedAt;

    public enum ExecutionStatus {
        ACTIVE, COMPLETED
    }
}
