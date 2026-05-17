package com.example.tourservice.service;

import com.example.tourservice.dto.TourDtos.*;
import com.example.tourservice.exception.NotFoundException;
import com.example.tourservice.exception.ValidationException;
import com.example.tourservice.model.*;
import com.example.tourservice.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TourService {

    private final TourRepository tourRepository;
    private final KeyPointRepository keyPointRepository;
    private final ReviewRepository reviewRepository;
    private final TourDurationRepository durationRepository;

    // ── TOUR CRUD ─────────────────────────────────────────────────────────────

    @Transactional
    public TourResponse createTour(CreateTourRequest req) {
        Tour tour = new Tour();
        tour.setName(req.getName());
        tour.setDescription(req.getDescription());
        tour.setDifficulty(req.getDifficulty());
        tour.setTags(req.getTags() != null ? req.getTags() : List.of());
        tour.setAuthorId(req.getAuthorId());
        tour.setStatus(Tour.TourStatus.DRAFT);
        tour.setPrice(0.0);
        return toResponse(tourRepository.save(tour));
    }

    public TourResponse getTour(Long id) {
        return toResponse(findTour(id));
    }

    public List<TourResponse> getToursByAuthor(Long authorId) {
        return tourRepository.findByAuthorId(authorId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<TourResponse> getPublishedTours() {
        return tourRepository.findByStatus(Tour.TourStatus.PUBLISHED)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public TourResponse updateTour(Long id, UpdateTourRequest req) {
        Tour tour = findTour(id);
        if (tour.getStatus() == Tour.TourStatus.PUBLISHED) {
            throw new ValidationException("Cannot edit a published tour directly. Archive it first.");
        }
        if (req.getName() != null) tour.setName(req.getName());
        if (req.getDescription() != null) tour.setDescription(req.getDescription());
        if (req.getDifficulty() != null) tour.setDifficulty(req.getDifficulty());
        if (req.getTags() != null) tour.setTags(req.getTags());
        if (req.getPrice() != null) tour.setPrice(req.getPrice());
        return toResponse(tourRepository.save(tour));
    }

    @Transactional
    public TourResponse publishTour(Long id) {
        Tour tour = findTour(id);

        if (tour.getName() == null || tour.getDescription() == null
                || tour.getDifficulty() == null || tour.getTags().isEmpty()) {
            throw new ValidationException("Tour must have name, description, difficulty and tags to be published.");
        }
        if (tour.getKeyPoints().size() < 2) {
            throw new ValidationException("Tour must have at least 2 key points to be published.");
        }
        if (durationRepository.findByTourId(id).isEmpty()) {
            throw new ValidationException("Tour must have at least one duration (transport type + minutes).");
        }

        tour.setStatus(Tour.TourStatus.PUBLISHED);
        tour.setPublishedAt(LocalDateTime.now());
        return toResponse(tourRepository.save(tour));
    }

    @Transactional
    public TourResponse archiveTour(Long id) {
        Tour tour = findTour(id);
        if (tour.getStatus() != Tour.TourStatus.PUBLISHED) {
            throw new ValidationException("Only published tours can be archived.");
        }
        tour.setStatus(Tour.TourStatus.ARCHIVED);
        tour.setArchivedAt(LocalDateTime.now());
        return toResponse(tourRepository.save(tour));
    }

    @Transactional
    public TourResponse reactivateTour(Long id) {
        Tour tour = findTour(id);
        if (tour.getStatus() != Tour.TourStatus.ARCHIVED) {
            throw new ValidationException("Only archived tours can be reactivated.");
        }
        tour.setStatus(Tour.TourStatus.PUBLISHED);
        tour.setArchivedAt(null);
        return toResponse(tourRepository.save(tour));
    }

    @Transactional
    public void deleteTour(Long id) {
        tourRepository.delete(findTour(id));
    }

    // ── KEY POINTS ────────────────────────────────────────────────────────────

    @Transactional
    public KeyPointResponse addKeyPoint(Long tourId, CreateKeyPointRequest req) {
        Tour tour = findTour(tourId);
        KeyPoint kp = new KeyPoint();
        kp.setName(req.getName());
        kp.setDescription(req.getDescription());
        kp.setLatitude(req.getLatitude());
        kp.setLongitude(req.getLongitude());
        kp.setImageUrl(req.getImageUrl());
        kp.setOrderIndex(req.getOrderIndex());
        kp.setTour(tour);
        KeyPoint saved = keyPointRepository.save(kp);

        // Recalculate tour length after adding key point
        recalculateTourLength(tourId);

        return toKeyPointResponse(saved);
    }

    @Transactional
    public KeyPointResponse updateKeyPoint(Long tourId, Long keyPointId, UpdateKeyPointRequest req) {
        KeyPoint kp = keyPointRepository.findById(keyPointId)
                .orElseThrow(() -> new NotFoundException("Key point not found"));
        if (!kp.getTour().getId().equals(tourId)) {
            throw new ValidationException("Key point does not belong to this tour");
        }
        if (req.getName() != null) kp.setName(req.getName());
        if (req.getDescription() != null) kp.setDescription(req.getDescription());
        if (req.getLatitude() != null) kp.setLatitude(req.getLatitude());
        if (req.getLongitude() != null) kp.setLongitude(req.getLongitude());
        if (req.getImageUrl() != null) kp.setImageUrl(req.getImageUrl());
        kp.setOrderIndex(req.getOrderIndex());
        KeyPoint saved = keyPointRepository.save(kp);
        recalculateTourLength(tourId);
        return toKeyPointResponse(saved);
    }

    @Transactional
    public void deleteKeyPoint(Long tourId, Long keyPointId) {
        KeyPoint kp = keyPointRepository.findById(keyPointId)
                .orElseThrow(() -> new NotFoundException("Key point not found"));
        if (!kp.getTour().getId().equals(tourId)) {
            throw new ValidationException("Key point does not belong to this tour");
        }
        keyPointRepository.delete(kp);
        recalculateTourLength(tourId);
    }

    public List<KeyPointResponse> getKeyPoints(Long tourId) {
        return keyPointRepository.findByTourIdOrderByOrderIndex(tourId)
                .stream().map(this::toKeyPointResponse).collect(Collectors.toList());
    }

    // ── REVIEWS ───────────────────────────────────────────────────────────────

    @Transactional
    public ReviewResponse addReview(Long tourId, CreateReviewRequest req) {
        Tour tour = findTour(tourId);
        if (req.getRating() < 1 || req.getRating() > 5) {
            throw new ValidationException("Rating must be between 1 and 5.");
        }
        Review review = new Review();
        review.setRating(req.getRating());
        review.setComment(req.getComment());
        review.setTouristId(req.getTouristId());
        review.setTouristUsername(req.getTouristUsername());
        review.setVisitDate(req.getVisitDate());
        review.setImages(req.getImages() != null ? req.getImages() : List.of());
        review.setTour(tour);
        return toReviewResponse(reviewRepository.save(review));
    }

    public List<ReviewResponse> getReviewsForTour(Long tourId) {
        return reviewRepository.findByTourId(tourId)
                .stream().map(this::toReviewResponse).collect(Collectors.toList());
    }

    // ── DURATIONS ─────────────────────────────────────────────────────────────

    @Transactional
    public TourDurationResponse addDuration(Long tourId, CreateDurationRequest req) {
        Tour tour = findTour(tourId);
        TourDuration duration = new TourDuration();
        duration.setTransportType(req.getTransportType());
        duration.setMinutes(req.getMinutes());
        duration.setTour(tour);
        return toDurationResponse(durationRepository.save(duration));
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────

    private void recalculateTourLength(Long tourId) {
        List<KeyPoint> points = keyPointRepository.findByTourIdOrderByOrderIndex(tourId);
        if (points.size() < 2) return;

        double totalKm = 0;
        for (int i = 0; i < points.size() - 1; i++) {
            totalKm += haversineDistance(
                    points.get(i).getLatitude(), points.get(i).getLongitude(),
                    points.get(i + 1).getLatitude(), points.get(i + 1).getLongitude()
            );
        }

        Tour tour = findTour(tourId);
        tour.setLengthKm(Math.round(totalKm * 100.0) / 100.0);
        tourRepository.save(tour);
    }

    private double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private Tour findTour(Long id) {
        return tourRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Tour not found with id: " + id));
    }

    // ── MAPPERS ───────────────────────────────────────────────────────────────

    private TourResponse toResponse(Tour tour) {
        TourResponse r = new TourResponse();
        r.setId(tour.getId());
        r.setName(tour.getName());
        r.setDescription(tour.getDescription());
        r.setDifficulty(tour.getDifficulty());
        r.setTags(tour.getTags());
        r.setStatus(tour.getStatus());
        r.setPrice(tour.getPrice());
        r.setAuthorId(tour.getAuthorId());
        r.setLengthKm(tour.getLengthKm());
        r.setPublishedAt(tour.getPublishedAt());
        r.setArchivedAt(tour.getArchivedAt());
        r.setCreatedAt(tour.getCreatedAt());
        r.setKeyPoints(tour.getKeyPoints().stream().map(this::toKeyPointResponse).collect(Collectors.toList()));
        r.setDurations(durationRepository.findByTourId(tour.getId()).stream().map(this::toDurationResponse).collect(Collectors.toList()));
        r.setReviews(tour.getReviews().stream().map(this::toReviewResponse).collect(Collectors.toList()));
        return r;
    }

    private KeyPointResponse toKeyPointResponse(KeyPoint kp) {
        KeyPointResponse r = new KeyPointResponse();
        r.setId(kp.getId());
        r.setName(kp.getName());
        r.setDescription(kp.getDescription());
        r.setLatitude(kp.getLatitude());
        r.setLongitude(kp.getLongitude());
        r.setImageUrl(kp.getImageUrl());
        r.setOrderIndex(kp.getOrderIndex());
        return r;
    }

    private ReviewResponse toReviewResponse(Review review) {
        ReviewResponse r = new ReviewResponse();
        r.setId(review.getId());
        r.setRating(review.getRating());
        r.setComment(review.getComment());
        r.setTouristId(review.getTouristId());
        r.setTouristUsername(review.getTouristUsername());
        r.setVisitDate(review.getVisitDate());
        r.setCommentDate(review.getCommentDate());
        r.setImages(review.getImages());
        return r;
    }

    private TourDurationResponse toDurationResponse(TourDuration d) {
        TourDurationResponse r = new TourDurationResponse();
        r.setId(d.getId());
        r.setTransportType(d.getTransportType());
        r.setMinutes(d.getMinutes());
        return r;
    }
}
