package com.example.tourservice.service;

import com.example.tourservice.dto.TourDtos.*;
import com.example.tourservice.exception.NotFoundException;
import com.example.tourservice.model.PositionSimulator;
import com.example.tourservice.repository.PositionSimulatorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PositionSimulatorService {

    private final PositionSimulatorRepository repository;

    @Transactional
    public PositionResponse updatePosition(Long touristId, UpdatePositionRequest req) {
        PositionSimulator pos = repository.findByTouristId(touristId)
                .orElse(new PositionSimulator());
        pos.setTouristId(touristId);
        pos.setLatitude(req.getLatitude());
        pos.setLongitude(req.getLongitude());
        pos.setUpdatedAt(LocalDateTime.now());
        return toResponse(repository.save(pos));
    }

    public PositionResponse getPosition(Long touristId) {
        PositionSimulator pos = repository.findByTouristId(touristId)
                .orElseThrow(() -> new NotFoundException("No position found for tourist: " + touristId));
        return toResponse(pos);
    }

    private PositionResponse toResponse(PositionSimulator pos) {
        PositionResponse r = new PositionResponse();
        r.setTouristId(pos.getTouristId());
        r.setLatitude(pos.getLatitude());
        r.setLongitude(pos.getLongitude());
        r.setUpdatedAt(pos.getUpdatedAt());
        return r;
    }
}
