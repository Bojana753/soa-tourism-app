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
    public void getPublishedTours(TourProto.Empty request,
                                   StreamObserver<TourProto.TourListResponse> responseObserver) {
        List<Tour> publishedTours = tourRepository.findByStatus(Tour.TourStatus.PUBLISHED);

        TourProto.TourListResponse.Builder responseBuilder = TourProto.TourListResponse.newBuilder();

        for (Tour tour : publishedTours) {
            TourProto.TourMessage.Builder tourBuilder = TourProto.TourMessage.newBuilder()
                    .setId(tour.getId())
                    .setName(tour.getName() != null ? tour.getName() : "")
                    .setDescription(tour.getDescription() != null ? tour.getDescription() : "")
                    .setDifficulty(tour.getDifficulty() != null ? tour.getDifficulty().name() : "")
                    .setStatus(tour.getStatus().name())
                    .setPrice(tour.getPrice())
                    .setAuthorId(tour.getAuthorId() != null ? tour.getAuthorId() : 0)
                    .setLengthKm(tour.getLengthKm())
                    .setPublishedAt(tour.getPublishedAt() != null ? tour.getPublishedAt().toString() : "");

            if (tour.getTags() != null) {
                tourBuilder.addAllTags(tour.getTags());
            }

            keyPointRepository.findByTourIdOrderByOrderIndex(tour.getId())
                    .stream()
                    .findFirst()
                    .ifPresent(kp -> {
                        TourProto.KeyPointMessage keyPoint = TourProto.KeyPointMessage.newBuilder()
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

            durationRepository.findByTourId(tour.getId()).forEach(d -> {
                TourProto.DurationMessage duration = TourProto.DurationMessage.newBuilder()
                        .setId(d.getId())
                        .setTransportType(d.getTransportType().name())
                        .setMinutes(d.getMinutes())
                        .build();
                tourBuilder.addDurations(duration);
            });

            responseBuilder.addTours(tourBuilder.build());
        }

        responseObserver.onNext(responseBuilder.build());
        responseObserver.onCompleted();
    }
}
