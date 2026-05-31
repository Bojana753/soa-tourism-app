package com.example.tourservice.grpc;

import com.example.tourservice.dto.ExecutionDtos.ProximityResult;
import com.example.tourservice.service.TourExecutionService;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import net.devh.boot.grpc.server.service.GrpcService;

@GrpcService
@RequiredArgsConstructor
public class ExecutionGrpcService extends ExecutionServiceGrpc.ExecutionServiceImplBase {

    private final TourExecutionService executionService;

    @Override
    public void checkProximity(ProximityRequest request, StreamObserver<ProximityResponse> responseObserver) {
        try {
            ProximityResult result = executionService.checkProximity(
                    request.getSessionId(),
                    request.getTouristId(),
                    request.getLatitude(),
                    request.getLongitude()
            );

            ProximityResponse response = ProximityResponse.newBuilder()
                    .setWithinRange(result.withinRange())
                    .setDistanceMeters(result.distanceMeters())
                    .setKeyPointId(result.keyPointId())
                    .setKeyPointName(result.keyPointName())
                    .setKeyPointCompleted(result.keyPointCompleted())
                    .setCompletedKeyPoints(result.completedKeyPoints())
                    .setTotalKeyPoints(result.totalKeyPoints())
                    .setTourCompleted(result.tourCompleted())
                    .build();

            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (RuntimeException ex) {
            responseObserver.onError(Status.INVALID_ARGUMENT
                    .withDescription(ex.getMessage())
                    .withCause(ex)
                    .asRuntimeException());
        }
    }
}
