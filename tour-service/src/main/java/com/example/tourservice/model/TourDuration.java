package com.example.tourservice.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "tour_durations")
@Data
public class TourDuration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private TransportType transportType;

    private int minutes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tour_id", nullable = false)
    private Tour tour;

    public enum TransportType {
        WALKING, BICYCLE, CAR
    }
}
