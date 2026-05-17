package com.example.tourservice.controller;

import com.example.tourservice.dto.TourDtos.*;
import com.example.tourservice.service.TourService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tours")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TourController {

    private final TourService tourService;

    // ── TOURS ─────────────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<TourResponse> createTour(@Valid @RequestBody CreateTourRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tourService.createTour(req));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TourResponse> getTour(@PathVariable Long id) {
        return ResponseEntity.ok(tourService.getTour(id));
    }

    @GetMapping("/author/{authorId}")
    public ResponseEntity<List<TourResponse>> getToursByAuthor(@PathVariable Long authorId) {
        return ResponseEntity.ok(tourService.getToursByAuthor(authorId));
    }

    @GetMapping("/published")
    public ResponseEntity<List<TourResponse>> getPublishedTours() {
        return ResponseEntity.ok(tourService.getPublishedTours());
    }

    @PutMapping("/{id}")
    public ResponseEntity<TourResponse> updateTour(@PathVariable Long id,
                                                    @RequestBody UpdateTourRequest req) {
        return ResponseEntity.ok(tourService.updateTour(id, req));
    }

    @PutMapping("/{id}/publish")
    public ResponseEntity<TourResponse> publishTour(@PathVariable Long id) {
        return ResponseEntity.ok(tourService.publishTour(id));
    }

    @PutMapping("/{id}/archive")
    public ResponseEntity<TourResponse> archiveTour(@PathVariable Long id) {
        return ResponseEntity.ok(tourService.archiveTour(id));
    }

    @PutMapping("/{id}/reactivate")
    public ResponseEntity<TourResponse> reactivateTour(@PathVariable Long id) {
        return ResponseEntity.ok(tourService.reactivateTour(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTour(@PathVariable Long id) {
        tourService.deleteTour(id);
        return ResponseEntity.noContent().build();
    }

    // ── KEY POINTS ────────────────────────────────────────────────────────────

    @PostMapping("/{tourId}/keypoints")
    public ResponseEntity<KeyPointResponse> addKeyPoint(@PathVariable Long tourId,
                                                         @Valid @RequestBody CreateKeyPointRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tourService.addKeyPoint(tourId, req));
    }

    @GetMapping("/{tourId}/keypoints")
    public ResponseEntity<List<KeyPointResponse>> getKeyPoints(@PathVariable Long tourId) {
        return ResponseEntity.ok(tourService.getKeyPoints(tourId));
    }

    @PutMapping("/{tourId}/keypoints/{keyPointId}")
    public ResponseEntity<KeyPointResponse> updateKeyPoint(@PathVariable Long tourId,
                                                            @PathVariable Long keyPointId,
                                                            @RequestBody UpdateKeyPointRequest req) {
        return ResponseEntity.ok(tourService.updateKeyPoint(tourId, keyPointId, req));
    }

    @DeleteMapping("/{tourId}/keypoints/{keyPointId}")
    public ResponseEntity<Void> deleteKeyPoint(@PathVariable Long tourId,
                                                @PathVariable Long keyPointId) {
        tourService.deleteKeyPoint(tourId, keyPointId);
        return ResponseEntity.noContent().build();
    }

    // ── REVIEWS ───────────────────────────────────────────────────────────────

    @PostMapping("/{tourId}/reviews")
    public ResponseEntity<ReviewResponse> addReview(@PathVariable Long tourId,
                                                     @Valid @RequestBody CreateReviewRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tourService.addReview(tourId, req));
    }

    @GetMapping("/{tourId}/reviews")
    public ResponseEntity<List<ReviewResponse>> getReviews(@PathVariable Long tourId) {
        return ResponseEntity.ok(tourService.getReviewsForTour(tourId));
    }

    // ── DURATIONS ─────────────────────────────────────────────────────────────

    @PostMapping("/{tourId}/durations")
    public ResponseEntity<TourDurationResponse> addDuration(@PathVariable Long tourId,
                                                             @Valid @RequestBody CreateDurationRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tourService.addDuration(tourId, req));
    }
}
