package com.example.tourservice.dto;

import com.example.tourservice.model.Tour;
import com.example.tourservice.model.TourDuration;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class TourDtos {

    // ── TOUR ─────────────────────────────────────────────────────────────────

    @Data
    public static class CreateTourRequest {
        @NotBlank
        private String name;
        private String description;
        private Tour.Difficulty difficulty;
        private List<String> tags;
        @NotNull
        private Long authorId;
    }

    @Data
    public static class UpdateTourRequest {
        private String name;
        private String description;
        private Tour.Difficulty difficulty;
        private List<String> tags;
        private Double price;
    }

    @Data
    public static class TourResponse {
        private Long id;
        private String name;
        private String description;
        private Tour.Difficulty difficulty;
        private List<String> tags;
        private Tour.TourStatus status;
        private double price;
        private Long authorId;
        private double lengthKm;
        private LocalDateTime publishedAt;
        private LocalDateTime archivedAt;
        private LocalDateTime createdAt;
        private List<KeyPointResponse> keyPoints;
        private List<TourDurationResponse> durations;
        private List<ReviewResponse> reviews;
    }

    // ── KEY POINT ────────────────────────────────────────────────────────────

    @Data
    public static class CreateKeyPointRequest {
        @NotBlank
        private String name;
        private String description;
        @NotNull
        private Double latitude;
        @NotNull
        private Double longitude;
        private String imageUrl;
        private int orderIndex;
    }

    @Data
    public static class UpdateKeyPointRequest {
        private String name;
        private String description;
        private Double latitude;
        private Double longitude;
        private String imageUrl;
        private int orderIndex;
    }

    @Data
    public static class KeyPointResponse {
        private Long id;
        private String name;
        private String description;
        private double latitude;
        private double longitude;
        private String imageUrl;
        private int orderIndex;
    }

    // ── REVIEW ───────────────────────────────────────────────────────────────

    @Data
    public static class CreateReviewRequest {
        @Min(1) @Max(5)
        private int rating;
        private String comment;
        @NotNull
        private Long touristId;
        @NotBlank
        private String touristUsername;
        private LocalDate visitDate;
        private List<String> images;
    }

    @Data
    public static class ReviewResponse {
        private Long id;
        private int rating;
        private String comment;
        private Long touristId;
        private String touristUsername;
        private LocalDate visitDate;
        private LocalDateTime commentDate;
        private List<String> images;
    }

    // ── DURATION ─────────────────────────────────────────────────────────────

    @Data
    public static class CreateDurationRequest {
        @NotNull
        private TourDuration.TransportType transportType;
        @Min(1)
        private int minutes;
    }

    @Data
    public static class TourDurationResponse {
        private Long id;
        private TourDuration.TransportType transportType;
        private int minutes;
    }

    // ── POSITION SIMULATOR ───────────────────────────────────────────────────

    @Data
    public static class UpdatePositionRequest {
        @NotNull
        private Double latitude;
        @NotNull
        private Double longitude;
    }

    @Data
    public static class PositionResponse {
        private Long touristId;
        private double latitude;
        private double longitude;
        private LocalDateTime updatedAt;
    }
}
