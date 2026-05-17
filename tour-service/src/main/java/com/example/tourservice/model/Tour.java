package com.example.tourservice.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tours")
@Data
public class Tour {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    private Difficulty difficulty;

    @ElementCollection
    @CollectionTable(name = "tour_tags", joinColumns = @JoinColumn(name = "tour_id"))
    @Column(name = "tag")
    private List<String> tags = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    private TourStatus status = TourStatus.DRAFT;

    private double price = 0.0;

    private Long authorId;

    private double lengthKm = 0.0;

    private LocalDateTime publishedAt;
    private LocalDateTime archivedAt;
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "tour", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<KeyPoint> keyPoints = new ArrayList<>();

    @OneToMany(mappedBy = "tour", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Review> reviews = new ArrayList<>();

    @OneToMany(mappedBy = "tour", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TourDuration> durations = new ArrayList<>();

    public enum TourStatus {
        DRAFT, PUBLISHED, ARCHIVED
    }

    public enum Difficulty {
        EASY, MEDIUM, HARD
    }
}
