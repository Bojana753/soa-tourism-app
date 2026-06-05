package com.example.tourservice.service;

import com.example.tourservice.dto.ExecutionDtos.ProximityResult;
import com.example.tourservice.dto.ExecutionDtos.StartTourExecutionRequest;
import com.example.tourservice.dto.ExecutionDtos.TourExecutionResponse;
import com.example.tourservice.exception.NotFoundException;
import com.example.tourservice.exception.ValidationException;
import com.example.tourservice.model.KeyPoint;
import com.example.tourservice.model.TourExecution;
import com.example.tourservice.repository.KeyPointRepository;
import com.example.tourservice.repository.TourExecutionRepository;
import com.example.tourservice.repository.TourRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TourExecutionService {

    private static final double PROXIMITY_THRESHOLD_METERS = 100.0;

    private final TourExecutionRepository executionRepository;
    private final TourRepository tourRepository;
    private final KeyPointRepository keyPointRepository;
    private final PurchaseClient purchaseClient;

    @Transactional
    public TourExecutionResponse startExecution(StartTourExecutionRequest request) {
        tourRepository.findById(request.getTourId())
                .orElseThrow(() -> new NotFoundException("Tour not found with id: " + request.getTourId()));

        if (!purchaseClient.hasPurchasedTour(request.getTouristId(), request.getTourId())) {
            throw new ValidationException("Tour must be purchased before an execution session can be started.");
        }

        executionRepository.findFirstByTouristIdAndStatus(
                        request.getTouristId(), TourExecution.ExecutionStatus.ACTIVE
                )
                .ifPresent(active -> {
                    throw new ValidationException(
                            "Tourist already has an active execution session: " + active.getId()
                    );
                });

        List<KeyPoint> keyPoints = keyPointRepository.findByTourIdOrderByOrderIndex(request.getTourId());
        if (keyPoints.isEmpty()) {
            throw new ValidationException("Tour has no key points.");
        }

        TourExecution execution = new TourExecution();
        execution.setTourId(request.getTourId());
        execution.setTouristId(request.getTouristId());
        return toResponse(executionRepository.save(execution), keyPoints.size());
    }

    public TourExecutionResponse getExecution(Long id) {
        TourExecution execution = findExecution(id);
        return toResponse(execution, countKeyPoints(execution.getTourId()));
    }

    public List<TourExecutionResponse> getExecutionsForTourist(Long touristId) {
        return executionRepository.findByTouristIdOrderByStartedAtDesc(touristId)
                .stream()
                .map(execution -> toResponse(execution, countKeyPoints(execution.getTourId())))
                .toList();
    }

    @Transactional
    public ProximityResult checkProximity(Long sessionId, Long touristId, double latitude, double longitude) {
        TourExecution execution = findExecution(sessionId);
        if (!execution.getTouristId().equals(touristId)) {
            throw new ValidationException("Execution session does not belong to this tourist.");
        }

        List<KeyPoint> keyPoints = keyPointRepository.findByTourIdOrderByOrderIndex(execution.getTourId());
        if (keyPoints.isEmpty()) {
            throw new ValidationException("Tour has no key points.");
        }

        execution.setLastLatitude(latitude);
        execution.setLastLongitude(longitude);
        execution.setLastActivityAt(LocalDateTime.now());

        if (execution.getStatus() == TourExecution.ExecutionStatus.COMPLETED) {
            executionRepository.save(execution);
            return new ProximityResult(false, 0.0, 0L, "", false,
                    keyPoints.size(), keyPoints.size(), true);
        }

        KeyPoint nextKeyPoint = keyPoints.get(execution.getNextKeyPointIndex());
        double distanceMeters = haversineDistanceMeters(
                latitude, longitude, nextKeyPoint.getLatitude(), nextKeyPoint.getLongitude()
        );
        boolean withinRange = distanceMeters <= PROXIMITY_THRESHOLD_METERS;
        boolean tourCompleted = false;

        if (withinRange) {
            execution.setNextKeyPointIndex(execution.getNextKeyPointIndex() + 1);
            if (execution.getNextKeyPointIndex() == keyPoints.size()) {
                execution.setStatus(TourExecution.ExecutionStatus.COMPLETED);
                execution.setCompletedAt(LocalDateTime.now());
                tourCompleted = true;
            }
        }

        executionRepository.save(execution);
        return new ProximityResult(
                withinRange,
                Math.round(distanceMeters * 100.0) / 100.0,
                nextKeyPoint.getId(),
                nextKeyPoint.getName(),
                withinRange,
                execution.getNextKeyPointIndex(),
                keyPoints.size(),
                tourCompleted
        );
    }

    private TourExecution findExecution(Long id) {
        return executionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Tour execution not found with id: " + id));
    }

    private int countKeyPoints(Long tourId) {
        return keyPointRepository.findByTourIdOrderByOrderIndex(tourId).size();
    }

    private TourExecutionResponse toResponse(TourExecution execution, int totalKeyPoints) {
        TourExecutionResponse response = new TourExecutionResponse();
        response.setId(execution.getId());
        response.setTourId(execution.getTourId());
        response.setTouristId(execution.getTouristId());
        response.setStatus(execution.getStatus());
        response.setCompletedKeyPoints(execution.getNextKeyPointIndex());
        response.setTotalKeyPoints(totalKeyPoints);
        response.setLastLatitude(execution.getLastLatitude());
        response.setLastLongitude(execution.getLastLongitude());
        response.setStartedAt(execution.getStartedAt());
        response.setLastActivityAt(execution.getLastActivityAt());
        response.setCompletedAt(execution.getCompletedAt());
        return response;
    }

    private double haversineDistanceMeters(double lat1, double lon1, double lat2, double lon2) {
        final double earthRadiusMeters = 6_371_000.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
