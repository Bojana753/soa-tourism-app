package com.example.tourservice.grpc;

import com.example.tourservice.model.Tour;
import com.example.tourservice.repository.KeyPointRepository;
import com.example.tourservice.repository.TourDurationRepository;
import com.example.tourservice.repository.TourRepository;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import net.devh.boot.grpc.server.service.GrpcService;

import java.util.List;

@GrpcService
@RequiredArgsConstructor
public class TourGrpcService extends TourServiceGrpc.TourServiceImplBase {

    private final TourRepository tourRepository;
    private final KeyPointRepository keyPointRepository;
    private final TourDurationRepository durationRepository;

    @Override
    public void getPublishedTours(Empty request,
                                   StreamObserver<TourListResponse> responseObserver) {

        List<Tour> publishedTours = tourRepository.findByStatus(Tour.TourStatus.PUBLISHED);

        System.out.println("gRPC: found " + publishedTours.size() + " published tours");

        TourListResponse.Builder responseBuilder = TourListResponse.newBuilder();

        for (Tour tour : publishedTours) {
            System.out.println("gRPC processing tour: " + tour.getId() + " - " + tour.getName());

            TourMessage.Builder tourBuilder = TourMessage.newBuilder()
                    .setId(tour.getId())
                    .setName(tour.getName() != null ? tour.getName() : "")
                    .setDescription(tour.getDescription() != null ? tour.getDescription() : "")
                    .setDifficulty(tour.getDifficulty() != null ? tour.getDifficulty().name() : "")
                    .setStatus(tour.getStatus().name())
                    .setPrice(tour.getPrice())
                    .setAuthorId(tour.getAuthorId() != null ? tour.getAuthorId() : 0)
                    .setLengthKm(tour.getLengthKm())
                    .setPublishedAt(tour.getPublishedAt() != null ? tour.getPublishedAt().toString() : "");

            try {
                List<String> tags = tourRepository.findById(tour.getId())
                        .map(t -> t.getTags() != null ? t.getTags() : new java.util.ArrayList<String>())
                        .orElse(new java.util.ArrayList<>());
                tourBuilder.addAllTags(tags);
            } catch (Exception e) {
                System.out.println("Error loading tags for tour " + tour.getId() + ": " + e.getMessage());
            }

            try {
                keyPointRepository.findByTourIdOrderByOrderIndex(tour.getId())
                        .stream()
                        .findFirst()
                        .ifPresent(kp -> {
                            KeyPointMessage keyPoint = KeyPointMessage.newBuilder()
                                    .setId(kp.getId())
                                    .setName(kp.getName() != null ? kp.getName() : "")
                                    .setDescription(kp.getDescription() != null ? kp.getDescription() : "")
                                    .setLatitude(kp.getLatitude())
                                    .setLongitude(kp.getLongitude())
                                    .setImageUrl(kp.getImageUrl() != null ? kp.getImageUrl() : "")
                                    .setOrderIndex(kp.getOrderIndex())
                                    .build();
                            tourBuilder.setFirstKeyPoint(keyPoint);
                        });
            } catch (Exception e) {
                System.out.println("Error loading keypoints for tour " + tour.getId() + ": " + e.getMessage());
            }

            try {
                durationRepository.findByTourId(tour.getId()).forEach(d -> {
                    DurationMessage duration = DurationMessage.newBuilder()
                            .setId(d.getId())
                            .setTransportType(d.getTransportType().name())
                            .setMinutes(d.getMinutes())
                            .build();
                    tourBuilder.addDurations(duration);
                });
            } catch (Exception e) {
                System.out.println("Error loading durations for tour " + tour.getId() + ": " + e.getMessage());
            }

            responseBuilder.addTours(tourBuilder.build());
        }

        responseObserver.onNext(responseBuilder.build());
        responseObserver.onCompleted();
    }
}