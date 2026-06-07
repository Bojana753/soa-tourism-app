package com.example.tourservice.dto;

import com.example.tourservice.model.TourExecution;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

public class ExecutionDtos {

    @Data
    public static class StartTourExecutionRequest {
        @NotNull
        private Long tourId;

        @NotNull
        private Long touristId;
    }

    @Data
    public static class TourExecutionResponse {
        private Long id;
        private Long tourId;
        private Long touristId;
        private TourExecution.ExecutionStatus status;
        private int completedKeyPoints;
        private int totalKeyPoints;
        private Double lastLatitude;
        private Double lastLongitude;
        private LocalDateTime startedAt;
        private LocalDateTime lastActivityAt;
        private LocalDateTime completedAt;
    }

    @Data
    public static class PurchaseOwnershipResponse {
        private boolean purchased;
    }

    public record ProximityResult(
            boolean withinRange,
            double distanceMeters,
            long keyPointId,
            String keyPointName,
            boolean keyPointCompleted,
            int completedKeyPoints,
            int totalKeyPoints,
            boolean tourCompleted
    ) {}
}
