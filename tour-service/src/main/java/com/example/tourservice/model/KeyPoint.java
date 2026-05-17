package com.example.tourservice.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "key_points")
@Data
public class KeyPoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private double latitude;
    private double longitude;

    private String imageUrl;

    private int orderIndex;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tour_id", nullable = false)
    private Tour tour;
}
